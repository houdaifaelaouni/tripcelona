-- Translations of database content (tours, FAQs, blog, pages) ------------------
--
-- Spanish stays in the original columns. Every other language is one row per
-- field here: (entity, entity_id, locale, field) -> value. Values are jsonb so
-- rich text (Tiptap JSON) and lists (highlights, inclusions...) fit too.
-- A missing row means "show the Spanish text".

create table public.content_translations (
  entity text not null check (entity in (
    'tour', 'tour_itinerary', 'tour_faq', 'faq', 'post', 'page'
  )),
  entity_id uuid not null,
  locale text not null check (locale in ('en', 'fr', 'ca', 'it')),
  field text not null check (field ~ '^[a-z_]+$'),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (entity, entity_id, locale, field)
);
create index content_translations_lookup_idx
  on public.content_translations (entity, locale, entity_id);

alter table public.content_translations enable row level security;

-- Visitors only read translations of content that is itself published.
create policy "public reads translations of published content"
  on public.content_translations for select to anon, authenticated
  using (
    case entity
      when 'tour' then exists (
        select 1 from public.tours t where t.id = entity_id and t.status = 'published')
      when 'tour_itinerary' then exists (
        select 1 from public.tour_itinerary i join public.tours t on t.id = i.tour_id
         where i.id = entity_id and t.status = 'published')
      when 'tour_faq' then exists (
        select 1 from public.tour_faqs f join public.tours t on t.id = f.tour_id
         where f.id = entity_id and t.status = 'published')
      when 'faq' then exists (
        select 1 from public.faqs f where f.id = entity_id and f.status = 'published')
      when 'post' then exists (
        select 1 from public.posts p where p.id = entity_id and p.status = 'published')
      when 'page' then exists (
        select 1 from public.pages p where p.id = entity_id and p.status = 'published')
      else false
    end
  );

create policy "staff manage translations"
  on public.content_translations for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create trigger content_translations_updated_at
  before update on public.content_translations
  for each row execute function public.set_updated_at();
