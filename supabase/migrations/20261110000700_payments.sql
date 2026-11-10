-- Payments and booking confirmation (Sprint 6: US-19, US-20, US-21, US-22)
--
-- Redsys (decision D1) posts a signed notification to our server for every
-- payment attempt. That notification, not the browser redirect, is the source
-- of truth. Server code verifies the signature, then calls
-- apply_payment_result(), which stores the raw event once and moves the
-- booking from pending to paid in a single transaction. Replaying the same
-- notification is a no-op.

-- Every provider notification, stored verbatim and exactly once ---------------
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_ref text not null,
  event_key text not null,
  payload jsonb not null,
  outcome text,
  received_at timestamptz not null default now(),
  unique (provider, event_key)
);
create index payment_events_ref_idx on public.payment_events (provider, provider_ref);

alter table public.payment_events enable row level security;
alter table public.payment_events force row level security;
create policy "owner reads payment events" on public.payment_events
  for select to authenticated using ((select public.is_owner()));

-- Transactional emails, one row per booking and kind (idempotent sends) -------
create table public.booking_emails (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  kind text not null check (kind in ('confirmation', 'owner_alert', 'payment_failed', 'cancellation')),
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed')),
  provider_id text,
  error text,
  attempts integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, kind)
);
create trigger booking_emails_updated_at before update on public.booking_emails
  for each row execute function public.set_updated_at();

alter table public.booking_emails enable row level security;
alter table public.booking_emails force row level security;
create policy "owner reads booking emails" on public.booking_emails
  for select to authenticated using ((select public.is_owner()));

-- Refund bookkeeping on the payment row
alter table public.payments
  add column refunded_at timestamptz,
  add column refund_raw jsonb;

-- Apply a verified provider result. Returns one of:
--   duplicate        same event seen before, or payment no longer pending
--   unknown_order    no payment row for this provider reference
--   failed           payment declined; booking stays pending (customer may retry)
--   amount_mismatch  authorised amount differs from what we asked for (refund)
--   paid             booking confirmed, seats allocated
--   already_paid     booking was paid by an earlier attempt (refund this one)
--   booking_closed   booking was cancelled/refunded meanwhile (refund)
--   no_seats         hold lapsed and the seats were sold meanwhile (refund)
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
  end if;

  update public.payment_events set outcome = v_outcome where id = v_event_id;
  return v_outcome;
end;
$$;

-- Give back the seats of a booking whose departure stays on (single refund).
create or replace function public.release_booking_seats(p_booking_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total integer := 0;
  r record;
begin
  for r in
    update public.seat_holds h
       set status = 'released'
     where h.booking_id = p_booking_id and h.status in ('held', 'confirmed')
    returning h.departure_id, h.qty
  loop
    update public.tour_departures d
       set seats_taken = greatest(d.seats_taken - r.qty, 0),
           status = case when d.status = 'sold_out' then 'open'::public.departure_status
                         else d.status end
     where d.id = r.departure_id;
    v_total := v_total + r.qty;
  end loop;
  return v_total;
end;
$$;

revoke execute on function public.apply_payment_result(text, text, text, boolean, integer, jsonb) from public, anon, authenticated;
revoke execute on function public.release_booking_seats(uuid) from public, anon, authenticated;
grant execute on function public.apply_payment_result(text, text, text, boolean, integer, jsonb) to service_role;
grant execute on function public.release_booking_seats(uuid) to service_role;
