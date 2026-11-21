-- Media buyer toolkit: boarding check-in, ad attribution, landing pages ----------
--
-- 1. Check-in. Staff scan the e-ticket QR (PR #73) on the day and mark who
--    boarded.
-- 2. Attribution. The UTM tags / click ids the visitor arrived with are saved
--    on the booking, so the admin can show sales per campaign.
-- 3. Landing pages. A media buyer creates a page with a title (and slug); the
--    owner designs it afterwards. Published pages are public at /l/<slug>.

-- 1. Boarding check-in -------------------------------------------------------------
alter table public.booking_travellers
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by uuid references auth.users (id) on delete set null;

-- 2. Attribution ---------------------------------------------------------------
-- { utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, gclid,
--   ttclid, landing, referrer, consent, fbp, fbc, ttp, ip, ua, at }
alter table public.bookings
  add column attribution jsonb;

create index bookings_utm_campaign_idx
  on public.bookings ((attribution ->> 'utm_campaign'))
  where attribution is not null;

-- 3. Landing pages ---------------------------------------------------------------
create table public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 3 and 140),
  -- Brief for whoever designs the page: offer, audience, angle of the ad.
  brief text check (char_length(brief) <= 2000),
  tour_id uuid references public.tours (id) on delete set null,
  status public.content_status not null default 'draft',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger landing_pages_updated_at before update on public.landing_pages
  for each row execute function public.set_updated_at();

alter table public.landing_pages enable row level security;

create policy "public reads published landing pages" on public.landing_pages
  for select to anon, authenticated
  using (status = 'published');

create policy "staff manage landing pages" on public.landing_pages
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
