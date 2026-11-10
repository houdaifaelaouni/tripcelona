-- guard_media_delete() is a trigger function; nobody should call it over the
-- API. Found by the Supabase security advisor on the production project.
revoke execute on function public.guard_media_delete() from public, anon, authenticated;
