# Launch runbook (Sprint 9, US-40)

The cutover moves `tripcelona.com` from WordPress to the new site on Vercel.
**It can be undone**: until step T+7 the old WordPress stays untouched, and
DNS can point back to it within the 300 s TTL.

Owner: the Product Owner signs the go/no-go (`go-no-go.md`) before T-0.
Placeholders in `<angle brackets>` depend on open decisions (D7, D9, D10).

## T-7 days: production setup

1. **Supabase production project** (EU region).
   - `pnpm supabase link --project-ref <ref>` then `pnpm supabase db push`.
   - Auth: disable sign-ups, enable TOTP MFA, Site URL = `https://tripcelona.com`,
     redirect URL `https://tripcelona.com/admin/auth/confirm`.
   - Enable **Point-in-time recovery** (or daily backups) and do one test restore
     into a scratch project. Write down how long it took.
2. **Vercel project** linked to the repo, production branch `main`.
   Production env vars (Settings → Environment Variables, *Production* only):

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://tripcelona.com` |
   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | production project |
   | `REDSYS_MERCHANT_CODE`, `REDSYS_TERMINAL`, `REDSYS_SECRET_KEY` | **live** values from the bank |
   | `REDSYS_ENV` | `live` |
   | `RESEND_API_KEY`, `EMAIL_FROM` | sender on `<domain from D7>` |
   | `OWNER_EMAIL` | inbox for quote/contact/booking alerts |
   | `RATE_LIMIT_SALT` | long random string |
   | `MEDIA_FROM_STORAGE` | `true` (after step 4) |
   | `NEXT_PUBLIC_ALLOW_INDEXING` | `false` until T-0 |

   Never set `REDSYS_BASE_URL` in production (it is ignored there anyway).
   Preview env vars use the Redsys **test** values.
3. **Email (D7)**: verify the sender domain in Resend and add its SPF, DKIM
   and DMARC records. Test it by sending the contact form on a preview deployment.
4. **Content and media** into production:
   ```bash
   pnpm content:import --wxr <fresh export> --report import-report.json
   pnpm media:sync
   ```
   Check the report, then set `MEDIA_FROM_STORAGE=true` and redeploy.
5. **First owner**: `pnpm ops grant-staff <owner email> owner`.
   The owner fills **Ajustes** (legal data, phone, email, socials) and
   reviews `docs/legal/owner-review.md`.
6. **Monitoring**: uptime checks on `/health`, `/` and `/reservar` (any
   uptime service, alert to the owner). Errors are in Vercel → Logs
   (runtime errors); `SENTRY_DSN` is not wired yet.

## T-2 days: freeze

- Content freeze on WordPress: no new posts, products or orders.
- Full backup of WordPress (database and `wp-content/uploads`). Keep it
  outside the hosting.
- Take a fresh WordPress export and rerun `pnpm content:import` (it skips
  rows that already exist; pass `--overwrite` only for pages changed since).

## T-1 day: rehearsal on the production deployment

1. Lower the DNS TTL of `tripcelona.com` and `www` to **300 s** (D9).
2. On the Vercel production URL (`*.vercel.app`, still `noindex`):
   - `pnpm check:urls --base https://<project>.vercel.app --strict-pending`
     must report **0 failures**. Pending rows must be solved or accepted in
     the go/no-go.
   - Click through home, catalog, a tour, checkout to the Redsys page (do not
     pay yet), quote form, contact form, admin login.
   - Lighthouse mobile on home and a tour: performance ≥ 90, LCP ≤ 2.5 s.
3. **Rollback rehearsal**: note the current DNS records for WordPress
   (A/CNAME for `@` and `www`) in this document:
   `@ → <WordPress IP>`, `www → <WordPress host>`.

## T-0: cutover (low-traffic window, e.g. Tuesday 08:00)

1. Set `NEXT_PUBLIC_ALLOW_INDEXING=true` and redeploy production.
2. In Vercel → Domains, add `tripcelona.com` and `www.tripcelona.com`
   (redirect `www` to the apex with 308).
3. Point DNS to Vercel (records shown in Vercel). Wait for TLS to be issued.
4. Smoke test on `https://tripcelona.com`:
   - `pnpm check:urls --base https://tripcelona.com --strict-pending` → 0 failures.
   - **Live card payment**: book the cheapest departure for 1 person with a
     real card, check the confirmation page, the customer email and the owner
     email, then refund it from **Admin → Reservas**.
   - Quote and contact forms: submit one each, check they appear in
     **Admin → Solicitudes** and that the emails arrived.
5. Search Console: submit `https://tripcelona.com/sitemap.xml`.

**Rollback** (any P0 in the first hours): restore the WordPress DNS records
noted at T-1. With TTL 300 s visitors are back on WordPress within minutes.
Bookings made on the new site meanwhile stay in Supabase; contact those
customers from Admin → Reservas.

## T+1 h to T+7 days

- T+1 h: Vercel logs for 404 and 5xx; fix any missing redirect in
  `src/lib/seo/legacy.ts` and add it to `migration/urls.csv`.
- T+1 d: Search Console coverage and "Page with redirect" report.
- T+7 d: Core Web Vitals (Speed Insights), booking funnel review, then decide
  D10 (retire WordPress or keep it read-only at `<old host>` for 30 days).
