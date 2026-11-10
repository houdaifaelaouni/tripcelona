-- Row level security (US-07, PRD §9.4)
--
-- Model:
--   * anon / authenticated visitors: read published content only, never write.
--   * editor: read everything except personal data; write editorial content.
--   * owner: everything, including bookings, departures, prices and settings.
--   * Public forms and checkout write through server code using the service
--     role, which bypasses RLS. There are deliberately NO anon insert policies.

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- Public read policies ---------------------------------------------------------
create policy "public reads published tours" on public.tours
  for select to anon, authenticated
  using (status = 'published');

create policy "public reads departures of published tours" on public.tour_departures
  for select to anon, authenticated
  using (
    status in ('open', 'sold_out')
    and exists (select 1 from public.tours t where t.id = tour_id and t.status = 'published')
  );

create policy "public reads images of published tours" on public.tour_images
  for select to anon, authenticated
  using (exists (select 1 from public.tours t where t.id = tour_id and t.status = 'published'));

create policy "public reads itinerary of published tours" on public.tour_itinerary
  for select to anon, authenticated
  using (exists (select 1 from public.tours t where t.id = tour_id and t.status = 'published'));

create policy "public reads faqs of published tours" on public.tour_faqs
  for select to anon, authenticated
  using (exists (select 1 from public.tours t where t.id = tour_id and t.status = 'published'));

create policy "public reads published events" on public.events
  for select to anon, authenticated
  using (status = 'published');

create policy "public reads published posts" on public.posts
  for select to anon, authenticated
  using (status = 'published' and published_at is not null and published_at <= now());

create policy "public reads published pages" on public.pages
  for select to anon, authenticated
  using (status = 'published');

create policy "public reads published faqs" on public.faqs
  for select to anon, authenticated
  using (status = 'published');

create policy "public reads approved reviews" on public.reviews
  for select to anon, authenticated
  using (status = 'approved');

create policy "public reads media" on public.media
  for select to anon, authenticated
  using (true);

create policy "public reads public settings" on public.settings
  for select to anon, authenticated
  using (is_public);

create policy "public reads redirects" on public.redirects
  for select to anon, authenticated
  using (true);

-- Staff policies ---------------------------------------------------------------
-- Editorial content: editors and owners can read and write.
do $$
declare t text;
begin
  foreach t in array array[
    'tours', 'tour_images', 'tour_itinerary', 'tour_faqs', 'events', 'posts',
    'pages', 'faqs', 'reviews', 'media'
  ] loop
    execute format(
      'create policy "staff manage %1$s" on public.%1$I for all to authenticated
         using ((select public.is_staff())) with check ((select public.is_staff()))', t);
  end loop;
end $$;

-- Operational data: editors may read departures and settings (to build pages),
-- only owners may change them.
create policy "staff read departures" on public.tour_departures
  for select to authenticated using ((select public.is_staff()));
create policy "staff read settings" on public.settings
  for select to authenticated using ((select public.is_staff()));
create policy "staff read redirects" on public.redirects
  for select to authenticated using ((select public.is_staff()));

do $$
declare t text;
begin
  foreach t in array array['tour_departures', 'settings', 'redirects'] loop
    execute format(
      'create policy "owner writes %1$s" on public.%1$I for insert to authenticated
         with check ((select public.is_owner()))', t);
    execute format(
      'create policy "owner updates %1$s" on public.%1$I for update to authenticated
         using ((select public.is_owner())) with check ((select public.is_owner()))', t);
    execute format(
      'create policy "owner deletes %1$s" on public.%1$I for delete to authenticated
         using ((select public.is_owner()))', t);
  end loop;
end $$;

-- Personal data: owner only.
do $$
declare t text;
begin
  foreach t in array array['bookings', 'booking_travellers', 'tour_requests'] loop
    execute format(
      'create policy "owner manages %1$s" on public.%1$I for all to authenticated
         using ((select public.is_owner())) with check ((select public.is_owner()))', t);
  end loop;
end $$;

-- Append-only / provider-written data: owner may read; writes are server-only.
create policy "owner reads payments" on public.payments
  for select to authenticated using ((select public.is_owner()));
create policy "owner reads leads" on public.leads
  for select to authenticated using ((select public.is_owner()));
create policy "owner reads audit log" on public.audit_log
  for select to authenticated using ((select public.is_owner()));

-- Profiles: everyone signed in sees their own row; only owners see all and
-- change roles. Nobody can grant themselves a role.
create policy "users read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_owner()));
create policy "owner updates profiles" on public.profiles
  for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

-- Sequences used by server-side inserts only.
revoke all on sequence public.booking_reference_seq from anon, authenticated;
