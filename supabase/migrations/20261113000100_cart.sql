-- Shopping cart: one payment can cover several bookings ------------------------
--
-- A cart checkout creates one pending booking per excursion, all sharing a
-- cart_id, and one payment for their total (payments.cart_id). When the
-- gateway confirms, apply_payment_result confirms every booking of the cart
-- or none of them. Refunds of a single booking inside a cart are partial:
-- payments.refunded_cents tracks how much has gone back.

alter table public.bookings add column cart_id uuid;
create index bookings_cart_idx on public.bookings (cart_id) where cart_id is not null;

alter table public.payments add column cart_id uuid;
alter table public.payments add column refunded_cents integer not null default 0
  check (refunded_cents >= 0);
create index payments_cart_idx on public.payments (cart_id) where cart_id is not null;

create or replace function public.apply_payment_result(
  p_provider text,
  p_provider_ref text,
  p_event_key text,
  p_authorized boolean,
  p_amount_cents integer,
  p_payload jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_payment public.payments%rowtype;
  v_booking public.bookings%rowtype;
  v_hold uuid;
  v_outcome text;
  v_paid integer;
begin
  insert into public.payment_events (provider, provider_ref, event_key, payload)
  values (p_provider, p_provider_ref, p_event_key, p_payload)
  on conflict (provider, event_key) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    return 'duplicate';
  end if;

  select * into v_payment from public.payments
   where provider = p_provider and provider_ref = p_provider_ref
   for update;

  if not found then
    v_outcome := 'unknown_order';
  elsif v_payment.status <> 'pending' then
    v_outcome := 'duplicate';
  elsif not p_authorized then
    update public.payments set status = 'failed', raw_event = p_payload where id = v_payment.id;
    v_outcome := 'failed';
  elsif p_amount_cents is distinct from v_payment.amount_cents then
    -- Money was taken but not the amount we asked for: keep it visible for refund.
    update public.payments set status = 'succeeded', raw_event = p_payload where id = v_payment.id;
    v_outcome := 'amount_mismatch';
  else
    update public.payments set status = 'succeeded', raw_event = p_payload where id = v_payment.id;

    if v_payment.cart_id is null then
      select * into v_booking from public.bookings where id = v_payment.booking_id for update;

      if v_booking.status = 'paid' then
        v_outcome := 'already_paid';
      elsif v_booking.status <> 'pending' then
        v_outcome := 'booking_closed';
      else
        select h.id into v_hold from public.seat_holds h
         where h.booking_id = v_booking.id and h.status in ('held', 'confirmed')
         order by h.created_at desc limit 1;

        if v_hold is null or not public.confirm_hold(v_hold, v_booking.id) then
          -- The hold lapsed during payment: try to take the seats again.
          v_hold := public.hold_seats(v_booking.departure_id, v_booking.travellers, interval '1 minute');
          if v_hold is not null then
            perform public.confirm_hold(v_hold, v_booking.id);
          end if;
        end if;

        if v_hold is null then
          v_outcome := 'no_seats';
        else
          update public.bookings set status = 'paid' where id = v_booking.id;
          v_outcome := 'paid';
        end if;
      end if;
    else
      -- Cart: every booking is confirmed, or none. The inner block is a
      -- savepoint, so a failure rolls back the bookings already confirmed.
      v_paid := 0;
      begin
        for v_booking in
          select * from public.bookings where cart_id = v_payment.cart_id order by id for update
        loop
          if v_booking.status = 'paid' then
            v_paid := v_paid + 1;
            continue;
          elsif v_booking.status <> 'pending' then
            raise exception 'booking_closed';
          end if;

          select h.id into v_hold from public.seat_holds h
           where h.booking_id = v_booking.id and h.status in ('held', 'confirmed')
           order by h.created_at desc limit 1;

          if v_hold is null or not public.confirm_hold(v_hold, v_booking.id) then
            v_hold := public.hold_seats(v_booking.departure_id, v_booking.travellers, interval '1 minute');
            if v_hold is not null then
              perform public.confirm_hold(v_hold, v_booking.id);
            end if;
          end if;

          if v_hold is null then
            raise exception 'no_seats';
          end if;
          update public.bookings set status = 'paid' where id = v_booking.id;
        end loop;
        v_outcome := case when v_paid = (select count(*) from public.bookings where cart_id = v_payment.cart_id)
                          then 'already_paid' else 'paid' end;
      exception when raise_exception then
        v_outcome := case when sqlerrm = 'booking_closed' then 'booking_closed' else 'no_seats' end;
      end;
    end if;
  end if;

  update public.payment_events set outcome = v_outcome where id = v_event_id;
  return v_outcome;
end;
$$;

revoke execute on function public.apply_payment_result(text, text, text, boolean, integer, jsonb) from public, anon, authenticated;
grant execute on function public.apply_payment_result(text, text, text, boolean, integer, jsonb) to service_role;
