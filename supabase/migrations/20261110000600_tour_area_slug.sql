-- Catalog filter key for a tour's area (US-14). `area` stays the display
-- label ("Huesca (Aragón)"); `area_slug` is the stable URL value ("huesca").
alter table public.tours
  add column area_slug text check (area_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

create index tours_area_slug_idx on public.tours (area_slug);
