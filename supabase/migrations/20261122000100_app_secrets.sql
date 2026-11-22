-- App settings kept in Supabase Vault (encrypted at rest) for when they are
-- not set as Vercel variables: the Resend key, the sender, the owner's email
-- and the secret of the daily "Avisos" run. Only the service role can read them.
create or replace function public.app_secret(p_name text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'app.' || p_name
    and p_name in ('RESEND_API_KEY', 'EMAIL_FROM', 'OWNER_EMAIL', 'CRON_SECRET')
  order by updated_at desc
  limit 1
$$;

revoke all on function public.app_secret(text) from public, anon, authenticated;
grant execute on function public.app_secret(text) to service_role;

-- Daily "Avisos" email at 07:00 UTC (8:00 in Madrid in winter), called from
-- the database so it needs no Vercel cron secret.
create extension if not exists pg_net;

select cron.unschedule('avisos-daily')
where exists (select 1 from cron.job where jobname = 'avisos-daily');

select cron.schedule(
  'avisos-daily',
  '0 7 * * *',
  $$
  select net.http_get(
    url := 'https://www.tripcelona.com/api/cron/avisos',
    headers := jsonb_build_object('Authorization', 'Bearer ' || public.app_secret('CRON_SECRET'))
  )
  $$
);
