-- Storage buckets (PRD §8): public media, private documents.

insert into storage.buckets (id, name, public)
values ('media', 'media', true), ('private-docs', 'private-docs', false)
on conflict (id) do nothing;

create policy "public reads media bucket" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'media');

create policy "staff write media bucket" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_staff()));

create policy "staff update media bucket" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (select public.is_staff()))
  with check (bucket_id = 'media' and (select public.is_staff()));

create policy "owner deletes media bucket" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (select public.is_owner()));

create policy "owner manages private docs" on storage.objects
  for all to authenticated
  using (bucket_id = 'private-docs' and (select public.is_owner()))
  with check (bucket_id = 'private-docs' and (select public.is_owner()));
