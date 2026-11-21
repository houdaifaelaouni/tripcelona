-- Passenger details after payment, and the e-ticket email.
-- After paying, the customer fills one row per traveller (name, optional
-- ID document) and gets a downloadable ticket, also sent by email.

alter table public.booking_travellers
  add column if not exists document_id text,
  add column if not exists position integer not null default 0;

create index if not exists booking_travellers_order_idx
  on public.booking_travellers (booking_id, position);

alter table public.bookings
  add column if not exists passengers_completed_at timestamptz;

alter table public.booking_emails drop constraint if exists booking_emails_kind_check;
alter table public.booking_emails add constraint booking_emails_kind_check
  check (kind in ('confirmation', 'owner_alert', 'payment_failed', 'payment_request', 'cancellation', 'ticket'));
