-- Sprint 8 content, media and forms (US-27, US-28, US-29, US-34).
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a8', 'owner8@example.com'),
  ('00000000-0000-0000-0000-0000000000e8', 'editor8@example.com');
update public.profiles set role = 'owner' where id = '00000000-0000-0000-0000-0000000000a8';
update public.profiles set role = 'editor' where id = '00000000-0000-0000-0000-0000000000e8';

insert into public.media (id, path, source_url) values
  ('88888888-0000-0000-0000-000000000001', 'library/2026/11/cover.webp', null),
  ('88888888-0000-0000-0000-000000000002', 'content/2026/inline.webp', 'https://tripcelona.com/wp-content/uploads/x.jpg'),
  ('88888888-0000-0000-0000-000000000003', 'library/2026/11/unused.webp', null),
  ('88888888-0000-0000-0000-000000000004', 'library/2026/11/unused-2.webp', null);

insert into public.posts (slug, title, cover_id, content) values
  ('t8-post', 'Post', '88888888-0000-0000-0000-000000000001', '{"type":"doc","content":[]}');
insert into public.pages (slug, title, content) values
  ('t8-page', 'Page', '{"type":"doc","content":[{"type":"image","attrs":{"src":"https://tripcelona.com/wp-content/uploads/x.jpg"}}]}');

-- Usage counting
select is(public.media_usage('88888888-0000-0000-0000-000000000001'), 1, 'cover image counts as a use');
select is(public.media_usage('88888888-0000-0000-0000-000000000002'), 1, 'image embedded in page content counts as a use');
select is(public.media_usage('88888888-0000-0000-0000-000000000003'), 0, 'unused image has no uses');

-- Guarded delete
select throws_ok($$delete from public.media where id = '88888888-0000-0000-0000-000000000001'$$,
  'P0001', null, 'an image in use cannot be deleted');
delete from public.media where id = '88888888-0000-0000-0000-000000000003';
select is((select count(*)::int from public.media where id = '88888888-0000-0000-0000-000000000003'), 0,
  'an unused image can be deleted');

-- Editors cannot delete media; owners can
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000e8","role":"authenticated"}';
delete from public.media where id = '88888888-0000-0000-0000-000000000004';
select is((select count(*)::int from public.media where id = '88888888-0000-0000-0000-000000000004'), 1,
  'editor delete is ignored');
select is((select count(*)::int from public.leads), 0, 'editor cannot read contact messages');
select is((select count(*)::int from public.tour_requests), 0, 'editor cannot read quote requests');
select throws_ok($$select public.hit_rate_limit('x', 5, 600)$$, '42501', null,
  'signed-in users cannot call the rate limiter');

set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000a8","role":"authenticated"}';
delete from public.media where id = '88888888-0000-0000-0000-000000000004';
select is((select count(*)::int from public.media where id = '88888888-0000-0000-0000-000000000004'), 0,
  'owner deletes unused media');

-- Anonymous visitors cannot call it either
set local role anon;
select throws_ok($$select public.hit_rate_limit('x', 5, 600)$$, '42501', null,
  'visitors cannot call the rate limiter');

-- Rate limit window
set local role service_role;
select is(public.hit_rate_limit('t8-key', 2, 600), true, 'first hit is allowed');
select is(public.hit_rate_limit('t8-key', 2, 600), true, 'second hit is allowed');
select is(public.hit_rate_limit('t8-key', 2, 600), false, 'third hit in the window is blocked');

reset role;
select * from finish();
rollback;
