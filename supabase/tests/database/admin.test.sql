-- Admin roles (US-24): editors edit content but never prices, seats or personal data.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@example.com'),
  ('00000000-0000-0000-0000-0000000000e1', 'editor@example.com'),
  ('00000000-0000-0000-0000-0000000000c1', 'nobody@example.com');
update public.profiles set role = 'owner' where id = '00000000-0000-0000-0000-0000000000a1';
update public.profiles set role = 'editor' where id = '00000000-0000-0000-0000-0000000000e1';

insert into public.tours (id, slug, title, status)
values ('33333333-3333-3333-3333-333333333333', 'admin-tour', 'Admin', 'published');
insert into public.tour_departures (id, tour_id, starts_at, capacity, price_cents)
values ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', now() + interval '7 days', 10, 5000);
insert into public.bookings (departure_id, customer_name, email, travellers, total_cents)
values ('44444444-4444-4444-4444-444444444444', 'Ana', 'ana@example.com', 1, 5000);

-- Editor
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}';
update public.tours set summary = 'editado' where id = '33333333-3333-3333-3333-333333333333';
select is((select summary from public.tours where id = '33333333-3333-3333-3333-333333333333'), 'editado', 'editor edits tour content');
update public.tour_departures set price_cents = 1 where id = '44444444-4444-4444-4444-444444444444';
select is((select count(*)::int from public.bookings), 0, 'editor cannot read bookings');
select is((select count(*)::int from public.staff_members()), 0, 'editor cannot list staff');

-- Signed-in account without a role
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
update public.tours set summary = 'hack' where id = '33333333-3333-3333-3333-333333333333';
select is((select count(*)::int from public.profiles), 1, 'a user without role only sees their own profile');

-- Owner
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select is((select price_cents from public.tour_departures where id = '44444444-4444-4444-4444-444444444444'), 5000, 'editor price change was blocked');
select is((select summary from public.tours where id = '33333333-3333-3333-3333-333333333333'), 'editado', 'role-less user change was blocked');
update public.tour_departures set price_cents = 6000 where id = '44444444-4444-4444-4444-444444444444';
select is((select price_cents from public.tour_departures where id = '44444444-4444-4444-4444-444444444444'), 6000, 'owner changes prices');
select is((select count(*)::int from public.staff_members()), 2, 'owner lists staff');

reset role;
select * from finish();
rollback;
