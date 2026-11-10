-- Sprint 8: media library, blog/pages editor, quote inbox, site settings,
-- public forms (US-27, US-28, US-29, US-31, US-32, US-34).

-- Content traceability and page kinds ----------------------------------------
alter table public.posts
  add column tags text[] not null default '{}',
  add column source_url text;

alter table public.pages
  add column kind text not null default 'page' check (kind in ('page', 'legal')),
  add column published_at timestamptz,
  add column source_url text;

alter table public.faqs add column source_url text;

-- Media: guarded delete (FR-87) --------------------------------------------------
-- How many places use a media row: foreign keys plus images embedded in rich
-- text by URL. The admin shows this count and the trigger below enforces it.
create or replace function public.media_usage(p_media_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with m as (select path, coalesce(source_url, '\x01') as src from public.media where id = p_media_id)
  select
    (select count(*) from public.tour_images where media_id = p_media_id)::int
  + (select count(*) from public.posts where cover_id = p_media_id)::int
  + (select count(*) from public.events where image_id = p_media_id)::int
  + (select count(*) from public.posts, m
      where posts.content::text like '%' || m.path || '"%' or posts.content::text like '%' || m.src || '"%')::int
  + (select count(*) from public.pages, m
      where pages.content::text like '%' || m.path || '"%' or pages.content::text like '%' || m.src || '"%')::int;
$$;
revoke execute on function public.media_usage(uuid) from public, anon;
grant execute on function public.media_usage(uuid) to authenticated, service_role;

create or replace function public.guard_media_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.media_usage(old.id) > 0 then
    raise exception 'media % is still in use', old.id using errcode = 'P0001', hint = 'media_in_use';
  end if;
  return old;
end;
$$;

create trigger media_guard_delete before delete on public.media
  for each row execute function public.guard_media_delete();

-- Media rows can only be deleted by owners (storage delete is owner-only too).
drop policy "staff manage media" on public.media;
create policy "staff insert media" on public.media
  for insert to authenticated with check ((select public.is_staff()));
create policy "staff update media" on public.media
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "owner deletes media" on public.media
  for delete to authenticated using ((select public.is_owner()));

-- Quote requests (FR-40..FR-42) and contact messages (FR-72) ---------------------
alter table public.tour_requests
  add column company text,
  add column extras text[] not null default '{}',
  add column privacy_accepted_at timestamptz,
  add column notified_at timestamptz,
  add column email_error text;

alter table public.leads
  add column status public.request_status not null default 'new',
  add column admin_notes text,
  add column notified_at timestamptz,
  add column email_error text,
  add column updated_at timestamptz not null default now();
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

create policy "owner updates leads" on public.leads
  for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

-- Public form rate limiting --------------------------------------------------------
-- Fixed-window counter per key (a hash of form + client IP; no raw IPs stored).
-- Only the server (service role) calls it.
create table public.form_rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key (key, window_start)
);
alter table public.form_rate_limits enable row level security;
alter table public.form_rate_limits force row level security;

create or replace function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.form_rate_limits as r (key, window_start)
  values (p_key, v_window)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;
  delete from public.form_rate_limits where window_start < now() - interval '1 day';
  return v_hits <= p_limit; -- true = allowed
end;
$$;
revoke execute on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- Site settings (FR-86) -------------------------------------------------------------
-- Values observed on the live site (2026-11-10). Email stays null until the
-- owner sets a company address (PRD §5.5: the live one is a personal Gmail).
insert into public.settings (key, value) values
  ('whatsapp', '"+34 666 69 69 54"'::jsonb),
  ('email', 'null'::jsonb),
  ('socials', '{}'::jsonb),
  ('banner', '{"active": false, "text": "", "href": ""}'::jsonb),
  ('quote_extras', jsonb_build_array(
     'Comida en restaurante local, +18 € / persona',
     'Actividad extra (kayak, visita guiada o cata), +15 € / persona',
     'Fotógrafo para el grupo, +150 € / grupo',
     'Guía en inglés o francés, sin coste',
     'Recogida en otro punto de Barcelona, +60 € / grupo')),
  ('quote_note', to_jsonb('Grupos desde 8 personas. Descuento del 10% a partir de 15 personas y del 15% a partir de 30.'::text))
on conflict (key) do nothing;
-- phone may be missing on a fresh production database (seed.sql is dev only).
insert into public.settings (key, value) values ('phone', '"+34 666 69 69 54"'::jsonb)
on conflict (key) do nothing;
