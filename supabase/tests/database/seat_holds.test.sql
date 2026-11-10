-- Seat hold behaviour (US-08). Concurrency is tested in tests/db/holds.test.ts.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into public.tours (slug, title, status) values ('test-tour', 'Test', 'published');
insert into public.tour_departures (id, tour_id, starts_at, capacity, price_cents)
select '11111111-1111-1111-1111-111111111111', id, now() + interval '7 days', 3, 5000
from public.tours where slug = 'test-tour';

set local role service_role;

select isnt(public.hold_seats('11111111-1111-1111-1111-111111111111', 2), null, 'hold of 2 of 3 succeeds');
select is(public.hold_seats('11111111-1111-1111-1111-111111111111', 2), null, 'hold beyond capacity returns null');
select isnt(public.hold_seats('11111111-1111-1111-1111-111111111111', 1), null, 'last seat can be held');
select is((select status::text from public.tour_departures where id = '11111111-1111-1111-1111-111111111111'),
  'sold_out', 'departure flips to sold_out when full');

-- Expire one hold and run the release job.
update public.seat_holds set expires_at = now() - interval '1 second'
 where departure_id = '11111111-1111-1111-1111-111111111111' and qty = 2;
select is(public.release_expired_holds(), 1, 'expired hold is released');
select is((select seats_taken from public.tour_departures where id = '11111111-1111-1111-1111-111111111111'),
  1, 'released seats return to the pool');
select is((select status::text from public.tour_departures where id = '11111111-1111-1111-1111-111111111111'),
  'open', 'departure reopens after release');
select is(public.release_hold((select id from public.seat_holds where qty = 2 and departure_id = '11111111-1111-1111-1111-111111111111')),
  false, 'releasing twice is a no-op');
select throws_ok($$select public.hold_seats('11111111-1111-1111-1111-111111111111', 0)$$, '22023', null, 'qty must be positive');

reset role;
select * from finish();
rollback;
