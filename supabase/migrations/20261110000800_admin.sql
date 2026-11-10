-- Admin core (Sprint 7: US-24, US-26)

-- Manual bookings can email the customer a payment link.
alter table public.booking_emails drop constraint booking_emails_kind_check;
alter table public.booking_emails add constraint booking_emails_kind_check
  check (kind in ('confirmation', 'owner_alert', 'payment_failed', 'payment_request', 'cancellation'));

-- Staff list for the owner's team page without exposing auth.users to clients.
create or replace function public.staff_members()
returns table (id uuid, email text, full_name text, role public.staff_role, last_sign_in_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text, p.full_name, p.role, u.last_sign_in_at
    from public.profiles p
    join auth.users u on u.id = p.id
   where public.is_owner() and p.role is not null
   order by p.role, u.email;
$$;
revoke execute on function public.staff_members() from public, anon;
grant execute on function public.staff_members() to authenticated;
