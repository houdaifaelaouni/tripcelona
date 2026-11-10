-- Atomic seat holds with expiry (US-08, FR-31)
--
-- Checkout calls hold_seats() before payment. The single conditional UPDATE is
-- what prevents overselling: concurrent callers serialize on the departure row
-- and each re-checks capacity after the previous one commits.

create table public.seat_holds (
  id uuid primary key default gen_random_uuid(),
  departure_id uuid not null references public.tour_departures (id) on delete cascade,
  qty integer not null check (qty > 0),
  status public.hold_status not null default 'held',
  booking_id uuid references public.bookings (id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index seat_holds_expiry_idx on public.seat_holds (expires_at) where status = 'held';
create index seat_holds_departure_idx on public.seat_holds (departure_id);

create trigger seat_holds_updated_at before update on public.seat_holds
  for each row execute function public.set_updated_at();

alter table public.seat_holds enable row level security;
alter table public.seat_holds force row level security;
create policy "owner reads seat holds" on public.seat_holds
  for select to authenticated using ((select public.is_owner()));

-- Reserve qty seats. Returns the hold id, or NULL when the departure is not
-- open or does not have enough seats left.
create or replace function public.hold_seats(
  p_departure_id uuid,
  p_qty integer,
  p_ttl interval default interval '15 minutes'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hold_id uuid;
begin
  if p_qty is null or p_qty <= 0 then
    raise exception 'qty must be positive' using errcode = '22023';
  end if;

  update public.tour_departures d
     set seats_taken = d.seats_taken + p_qty,
         status = case when d.seats_taken + p_qty >= d.capacity
                       then 'sold_out'::public.departure_status else d.status end
   where d.id = p_departure_id
     and d.status = 'open'
     and d.starts_at > now()
     and d.seats_taken + p_qty <= d.capacity;

  if not found then
    return null;
  end if;

  insert into public.seat_holds (departure_id, qty, expires_at)
  values (p_departure_id, p_qty, now() + p_ttl)
  returning id into v_hold_id;

  return v_hold_id;
end;
$$;

-- Give the seats of a hold back (abandoned or failed checkout). Idempotent:
-- releasing a hold twice, or releasing a confirmed hold, does nothing.
create or replace function public.release_hold(p_hold_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_departure uuid;
  v_qty integer;
begin
  update public.seat_holds h
     set status = 'released'
   where h.id = p_hold_id and h.status = 'held'
  returning h.departure_id, h.qty into v_departure, v_qty;

  if not found then
    return false;
  end if;

  update public.tour_departures d
     set seats_taken = greatest(d.seats_taken - v_qty, 0),
         status = case when d.status = 'sold_out' then 'open'::public.departure_status
                       else d.status end
   where d.id = v_departure;

  return true;
end;
$$;

-- Turn a hold into a permanent seat allocation once payment is confirmed.
-- Returns false if the hold already expired/was released (caller must refund
-- or re-hold) or was already confirmed for another booking.
create or replace function public.confirm_hold(p_hold_id uuid, p_booking_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.seat_holds h
     set status = 'confirmed', booking_id = p_booking_id
   where h.id = p_hold_id
     and (h.status = 'held' or (h.status = 'confirmed' and h.booking_id = p_booking_id));
  return found;
end;
$$;

-- Release every expired hold. Scheduled every minute below.
create or replace function public.release_expired_holds()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in
    select h.id from public.seat_holds h
     where h.status = 'held' and h.expires_at <= now()
     for update skip locked
  loop
    if public.release_hold(v_id) then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

-- Only server code (service role) may move seats.
revoke execute on function public.hold_seats(uuid, integer, interval) from public, anon, authenticated;
revoke execute on function public.release_hold(uuid) from public, anon, authenticated;
revoke execute on function public.confirm_hold(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.release_expired_holds() from public, anon, authenticated;
grant execute on function public.hold_seats(uuid, integer, interval) to service_role;
grant execute on function public.release_hold(uuid) to service_role;
grant execute on function public.confirm_hold(uuid, uuid) to service_role;
grant execute on function public.release_expired_holds() to service_role;

-- Schedule hold expiry.
create extension if not exists pg_cron;
select cron.schedule('release-expired-seat-holds', '* * * * *', $$select public.release_expired_holds()$$);
