-- Full data model from PRD §8 (US-06)

-- Media ------------------------------------------------------------------------
create table public.media (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null,
  alt text,
  width integer check (width > 0),
  height integer check (height > 0),
  mime text,
  size_bytes bigint check (size_bytes >= 0),
  source_url text, -- legacy URL this file was migrated from (traceability)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, path)
);

-- Tours ------------------------------------------------------------------------
create table public.tours (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  subtitle text,
  area text,
  duration_minutes integer check (duration_minutes > 0),
  difficulty text,
  price_from_cents integer check (price_from_cents >= 0),
  summary text,
  description jsonb, -- Tiptap JSON
  highlights jsonb not null default '[]'::jsonb,
  inclusions jsonb not null default '[]'::jsonb,
  exclusions jsonb not null default '[]'::jsonb,
  packing_list jsonb not null default '[]'::jsonb,
  meeting_point text,
  map_url text,
  hero_image_id uuid references public.media (id) on delete set null,
  video_url text,
  status public.content_status not null default 'draft',
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tours_status_idx on public.tours (status);
create index tours_area_idx on public.tours (area);

create table public.tour_departures (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer not null check (capacity >= 0),
  seats_taken integer not null default 0 check (seats_taken >= 0),
  price_cents integer not null check (price_cents >= 0),
  status public.departure_status not null default 'open',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tour_id, starts_at),
  constraint seats_within_capacity check (seats_taken <= capacity),
  constraint ends_after_start check (ends_at is null or ends_at > starts_at)
);
create index tour_departures_starts_idx on public.tour_departures (starts_at);
create index tour_departures_tour_status_idx on public.tour_departures (tour_id, status, starts_at);

create table public.tour_images (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours (id) on delete cascade,
  media_id uuid references public.media (id) on delete set null,
  storage_path text not null,
  alt text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tour_images_tour_idx on public.tour_images (tour_id, sort_order);

create table public.tour_itinerary (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours (id) on delete cascade,
  sort_order integer not null default 0,
  time_label text,
  title text not null,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tour_itinerary_tour_idx on public.tour_itinerary (tour_id, sort_order);

create table public.tour_faqs (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours (id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tour_faqs_tour_idx on public.tour_faqs (tour_id, sort_order);

-- Bookings and payments --------------------------------------------------------
create sequence public.booking_reference_seq;

-- Human-readable reference, e.g. TC-2026-0001 (PRD §8). The counter is global,
-- not reset per year, so references stay unique and monotonic.
create or replace function public.next_booking_reference()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'TC-' || to_char(now() at time zone 'Europe/Madrid', 'YYYY') || '-'
         || lpad(nextval('public.booking_reference_seq')::text, 4, '0');
$$;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default public.next_booking_reference(),
  departure_id uuid not null references public.tour_departures (id) on delete restrict,
  customer_name text not null,
  email extensions.citext not null,
  phone text,
  travellers integer not null check (travellers > 0),
  total_cents integer not null check (total_cents >= 0),
  status public.booking_status not null default 'pending',
  pickup_note text,
  notes text,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_departure_idx on public.bookings (departure_id);
create index bookings_status_idx on public.bookings (status, created_at desc);
create index bookings_email_idx on public.bookings (email);

create table public.booking_travellers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  name text not null,
  age_group text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index booking_travellers_booking_idx on public.booking_travellers (booking_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete restrict,
  provider text not null, -- 'redsys' per decision D1
  provider_ref text not null, -- e.g. Redsys Ds_Order
  amount_cents integer not null check (amount_cents >= 0),
  status public.payment_status not null default 'pending',
  raw_event jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_ref) -- idempotent notification handling
);
create index payments_booking_idx on public.payments (booking_id);

-- Leads and requests -----------------------------------------------------------
create table public.tour_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email extensions.citext not null,
  phone text,
  group_size integer check (group_size > 0),
  preferred_dates text,
  tour_id uuid references public.tours (id) on delete set null,
  budget text,
  message text,
  status public.request_status not null default 'new',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tour_requests_status_idx on public.tour_requests (status, created_at desc);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  source text not null, -- 'contact', 'newsletter', ...
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index leads_source_idx on public.leads (source, created_at desc);

-- Content ----------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  price_cents integer check (price_cents >= 0),
  description jsonb,
  image_id uuid references public.media (id) on delete set null,
  cta_url text,
  cta_label text,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_status_starts_idx on public.events (status, starts_at);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  excerpt text,
  cover_id uuid references public.media (id) on delete set null,
  content jsonb,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  seo_title text,
  seo_description text,
  reading_minutes integer check (reading_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_status_published_idx on public.posts (status, published_at desc);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  content jsonb,
  status public.content_status not null default 'draft',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  category text,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index faqs_status_idx on public.faqs (status, category, sort_order);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  source text not null, -- where the review came from (decision D6)
  rating smallint check (rating between 1 and 5),
  text text not null,
  tour_id uuid references public.tours (id) on delete set null,
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reviews_tour_status_idx on public.reviews (tour_id, status);

-- Settings, redirects, audit ---------------------------------------------------
create table public.settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default true, -- false = staff-only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique check (from_path like '/%'),
  to_path text not null,
  status_code smallint not null default 301 check (status_code in (301, 302, 307, 308, 410)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid references auth.users (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  diff jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity, entity_id, created_at desc);

-- updated_at triggers on every table that has the column -----------------------
do $$
declare t text;
begin
  for t in
    select c.table_name from information_schema.columns c
    where c.table_schema = 'public' and c.column_name = 'updated_at'
      and c.table_name <> 'profiles'
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_updated_at', t);
  end loop;
end $$;
