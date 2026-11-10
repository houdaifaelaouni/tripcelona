-- Foundation: extensions, enums, shared helpers (US-06, US-07)

create extension if not exists citext with schema extensions;

-- Status enums -----------------------------------------------------------------
create type public.staff_role as enum ('owner', 'editor');
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.departure_status as enum ('open', 'sold_out', 'cancelled');
create type public.booking_status as enum ('pending', 'paid', 'cancelled', 'refunded');
create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
create type public.request_status as enum ('new', 'quoted', 'won', 'lost');
create type public.review_status as enum ('pending', 'approved', 'hidden');
create type public.hold_status as enum ('held', 'confirmed', 'released');

-- updated_at trigger -----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Staff profiles ---------------------------------------------------------------
-- Admin users are invite-only (FR-80). A profile without a role has no access.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.staff_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create an empty profile whenever an auth user is created (role stays null
-- until the owner grants one).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role helpers used by RLS policies. SECURITY DEFINER so policies on
-- profiles itself do not recurse.
create or replace function public.current_staff_role()
returns public.staff_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(public.current_staff_role() in ('owner', 'editor'), false);
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(public.current_staff_role() = 'owner', false);
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
