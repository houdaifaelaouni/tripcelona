-- Payment notifications (US-20): verified results are applied once, and
-- every edge case ends in a state the server can act on.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into public.tours (slug, title, status) values ('pay-tour', 'Pay', 'published');
insert into public.tour_departures (id, tour_id, starts_at, capacity, price_cents)
select '22222222-2222-2222-2222-222222222222', id, now() + interval '7 days', 2, 5000
from public.tours where slug = 'pay-tour';

set local role service_role;

-- Booking A: 2 seats held, pending payment of 100 €.
select public.hold_seats('22222222-2222-2222-2222-222222222222', 2) is not null as held \gset
insert into public.bookings (id, departure_id, customer_name, email, travellers, total_cents)
values ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Ana', 'ana@example.com', 2, 10000);
update public.seat_holds set booking_id = 'aaaaaaaa-0000-0000-0000-000000000001'
 where departure_id = '22222222-2222-2222-2222-222222222222';
insert into public.payments (booking_id, provider, provider_ref, amount_cents)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'redsys', '1111AAAA0001', 10000),
       ('aaaaaaaa-0000-0000-0000-000000000001', 'redsys', '1111AAAA0002', 10000),
       ('aaaaaaaa-0000-0000-0000-000000000001', 'redsys', '1111AAAA0003', 10000);

-- A declined attempt leaves the booking pending.
select is(public.apply_payment_result('redsys', '1111AAAA0001', '1111AAAA0001:0190', false, 10000, '{}'),
  'failed', 'declined payment is recorded as failed');
select is((select status::text from public.bookings where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'pending', 'booking stays pending after a decline');

-- The second attempt succeeds.
select is(public.apply_payment_result('redsys', '1111AAAA0002', '1111AAAA0002:0000', true, 10000, '{"Ds_Response":"0000"}'),
  'paid', 'authorised payment confirms the booking');
select is((select status::text from public.bookings where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'paid', 'booking is paid');
select is((select status::text from public.payments where provider_ref = '1111AAAA0002'),
  'succeeded', 'payment row is succeeded');
select is((select status::text from public.seat_holds where booking_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'confirmed', 'hold is confirmed');

-- Replays change nothing.
select is(public.apply_payment_result('redsys', '1111AAAA0002', '1111AAAA0002:0000', true, 10000, '{}'),
  'duplicate', 'identical replay is a duplicate');
select is(public.apply_payment_result('redsys', '1111AAAA0002', '1111AAAA0002:0000-retry', true, 10000, '{}'),
  'duplicate', 'a different event for a settled payment is a duplicate');
select is((select count(*)::int from public.payments where booking_id = 'aaaaaaaa-0000-0000-0000-000000000001' and status = 'succeeded'),
  1, 'no duplicate succeeded payment');
select is((select seats_taken from public.tour_departures where id = '22222222-2222-2222-2222-222222222222'),
  2, 'seats were counted once');

-- A third attempt that also succeeds must be flagged for refund.
select is(public.apply_payment_result('redsys', '1111AAAA0003', '1111AAAA0003:0000', true, 10000, '{}'),
  'already_paid', 'second successful payment is flagged');

select is(public.apply_payment_result('redsys', 'NOPE', 'NOPE:0000', true, 10000, '{}'),
  'unknown_order', 'unknown order is reported');

-- Booking B: hold lapsed and the seats are gone -> no_seats.
insert into public.bookings (id, departure_id, customer_name, email, travellers, total_cents)
values ('aaaaaaaa-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Bea', 'bea@example.com', 1, 5000);
insert into public.payments (booking_id, provider, provider_ref, amount_cents)
values ('aaaaaaaa-0000-0000-0000-000000000002', 'redsys', '2222BBBB0001', 5000),
       ('aaaaaaaa-0000-0000-0000-000000000002', 'redsys', '2222BBBB0002', 5000);
select is(public.apply_payment_result('redsys', '2222BBBB0001', '2222BBBB0001:0000', true, 5000, '{}'),
  'no_seats', 'paid after hold lapsed with no seats left');
select is((select status::text from public.bookings where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  'pending', 'booking without seats is not confirmed');

-- Free the seats of booking A; booking B can now be re-held on payment.
select is(public.release_booking_seats('aaaaaaaa-0000-0000-0000-000000000001'), 2, 'booking seats released');
select is(public.apply_payment_result('redsys', '2222BBBB0002', '2222BBBB0002:0000', true, 4000, '{}'),
  'amount_mismatch', 'amount mismatch is flagged');

reset role;
set local role anon;
select throws_ok($$select public.apply_payment_result('redsys', 'x', 'x', true, 1, '{}')$$,
  '42501', null, 'anon cannot apply payment results');

reset role;
select * from finish();
rollback;
