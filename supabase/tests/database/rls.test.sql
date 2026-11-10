-- RLS tests (US-07). Run: pnpm supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- Fixtures (as postgres, which bypasses RLS) ---------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'editor@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'nobody@test.local');
update public.profiles set role = 'owner'  where id = '00000000-0000-0000-0000-00000000000a';
update public.profiles set role = 'editor' where id = '00000000-0000-0000-0000-00000000000b';

insert into public.tours (slug, title, status) values ('borrador-secreto', 'Draft tour', 'draft');
insert into public.bookings (departure_id, customer_name, email, travellers, total_cents)
select id, 'Test Customer', 'customer@test.local', 2, 11800 from public.tour_departures limit 1;
insert into public.settings (key, value, is_public) values ('internal_note', '"x"', false);

select is((select count(*) from public.profiles where id::text like '00000000-0000-0000-0000-00000000000_')::int, 3,
  'auth trigger creates a profile per user');

-- Anonymous visitor -----------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is((select count(*) from public.tours)::int, 5, 'anon sees only the 5 published tours');
select is((select count(*) from public.tours where slug = 'borrador-secreto')::int, 0, 'anon cannot see drafts');
select ok((select count(*) from public.tour_departures) > 0, 'anon reads departures of published tours');
select is((select count(*) from public.bookings)::int, 0, 'anon cannot read bookings');
select is((select count(*) from public.settings where key = 'internal_note')::int, 0, 'anon cannot read private settings');
select ok((select count(*) from public.settings where key = 'phone') = 1, 'anon reads public settings');

select throws_ok($$insert into public.tours (slug, title) values ('hack', 'x')$$, '42501', null, 'anon cannot insert tours');
select throws_ok($$insert into public.bookings (departure_id, customer_name, email, travellers, total_cents)
  select id, 'x', 'x@x.x', 1, 0 from public.tour_departures limit 1$$, '42501', null, 'anon cannot insert bookings');
select throws_ok($$insert into public.tour_requests (name, email) values ('x', 'x@x.x')$$, '42501', null, 'anon cannot insert quote requests');
select throws_ok($$insert into public.leads (source, payload) values ('contact', '{}')$$, '42501', null, 'anon cannot insert leads');
update public.tour_departures set price_cents = 1;
delete from public.tours;
select throws_ok($$select public.hold_seats((select id from public.tour_departures limit 1), 1)$$, '42501', null, 'anon cannot call hold_seats');

reset role;
select is((select count(*) from public.tour_departures where price_cents = 1)::int, 0, 'anon update changed nothing');
select is((select count(*) from public.tours)::int, 6, 'anon delete removed nothing');

-- Signed-in user without a role ----------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select throws_ok($$insert into public.tours (slug, title) values ('nope', 'x')$$, '42501', null, 'user without role cannot write tours');
update public.profiles set role = 'owner' where id = '00000000-0000-0000-0000-00000000000c';
reset role;
select is((select role from public.profiles where id = '00000000-0000-0000-0000-00000000000c'), null, 'user cannot grant themselves a role');

-- Editor ------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select lives_ok($$insert into public.posts (slug, title) values ('nuevo-post', 'Nuevo')$$, 'editor can write posts');
select is((select count(*) from public.tours)::int, 6, 'editor sees draft tours');
select is((select count(*) from public.bookings)::int, 0, 'editor cannot read bookings (personal data)');
update public.tour_departures set capacity = 999;
select throws_ok($$insert into public.settings (key, value) values ('x', '1')$$, '42501', null, 'editor cannot write settings');
reset role;
select is((select count(*) from public.tour_departures where capacity = 999)::int, 0, 'editor cannot change departures/capacity');

-- Owner -------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((select count(*) from public.bookings)::int, 1, 'owner reads bookings');
update public.tour_departures set notes = 'owner edit' where id = (select departure_id from public.bookings limit 1);
select is((select count(*) from public.tour_departures where notes = 'owner edit')::int, 1, 'owner can change departures');
select throws_ok($$insert into public.payments (booking_id, provider, provider_ref, amount_cents)
  select id, 'redsys', 'x', 0 from public.bookings limit 1$$, '42501', null, 'payments are server-written only, even for owner');
reset role;

select * from finish();
rollback;
