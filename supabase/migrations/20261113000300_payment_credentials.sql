-- Payment gateway credentials, editable from the admin ---------------------------
--
-- One row per setting (STRIPE_SECRET_KEY, PAYMENT_PROVIDER, ...), value encrypted
-- by the app (AES-256-GCM) before it is stored. RLS is on with no policy at all:
-- neither visitors nor the logged-in admin session can read the table, only the
-- server with the service role. A value here overrides the Vercel variable of the
-- same name; when no row exists the Vercel variable is used.

create table public.payment_credentials (
  name text primary key check (name ~ '^[A-Z][A-Z0-9_]+$'),
  value text not null,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.payment_credentials enable row level security;

create trigger payment_credentials_updated_at before update on public.payment_credentials
  for each row execute function public.set_updated_at();
