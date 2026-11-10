# Operations runbook (US-42)

How to run the Tripcelona site after launch. For the cutover itself see
`docs/launch/runbook.md`; for the owner's day-to-day tasks in the admin see
`docs/owner-guide.md`.

Placeholders in `<angle brackets>` are filled in once the production accounts
exist (they depend on decisions D7 and D9).

## 1. Environments

| Environment | Web | Database | Payments | Email |
| --- | --- | --- | --- | --- |
| Local | `pnpm dev` (port 3000) | `pnpm supabase start` (Docker) | Redsys test, or the fake gateway (`tests/e2e/fake-redsys.mjs`) | logged to the console |
| Preview | Vercel preview per pull request | `<staging project or production read-only>` | Redsys **test** | Resend (test domain) |
| Production | Vercel production, `main` branch, `https://tripcelona.com` | Supabase production `<project ref>` (EU) | Redsys **live** | Resend, `<sender domain>` |

Env vars are listed in `.env.example` and, for production, in the table in
`docs/launch/runbook.md` (T-7). They live only in Vercel (Settings →
Environment Variables) and in each person's `.env.local`, never in git.

## 2. Accounts and access

| Service | What for | Who has access |
| --- | --- | --- |
| GitHub `houdaifaelaouni/tripcelona` | code, CI | `<owner>`, `<developer>` |
| Vercel | hosting, logs, domains | `<owner>`, `<developer>` |
| Supabase | database, auth, storage, backups | `<owner>`, `<developer>` |
| Redsys / bank portal | payments, refunds, terminal settings | `<owner>` |
| Resend | email sending, domain | `<owner>`, `<developer>` |
| Domain registrar | DNS (D9) | `<owner>` |

Keep at least two people with access to each, and turn on two-step
verification on all of them. The admin itself has TOTP under **Mi cuenta**.

## 3. Deploying

- Every pull request runs CI: typecheck, lint, unit tests, database tests,
  build, URL crawl, end-to-end tests and the secret scan. Vercel builds a
  preview for each pull request, and Lighthouse runs against it.
- Merge to `main` after CI passes, and production deploys automatically.
- **Database changes**: add a file in `supabase/migrations/`. CI runs it on a
  fresh database. After the merge, apply it to production with
  `pnpm supabase db push` (linked to the production project), **before** the
  new code needs it. Migrations must not break the code that is currently live
  (add columns first, remove them in a later release).

## 4. Rolling back

| What broke | How to undo it |
| --- | --- |
| A code deploy | Vercel → Deployments → previous production deployment → **Instant Rollback**. Then revert the commit on `main`. |
| A migration | Write a new migration that undoes it; never edit an applied one. For data loss, see backups below. |
| Settings or content changed by mistake | The admin keeps an audit log (`audit_log` table). Restore by hand from it, or from a backup. |
| DNS or the whole launch (first 7 days) | Point DNS back to WordPress (`docs/launch/runbook.md`, rollback). |

## 5. Backups and restore

- Supabase production: **Point-in-time recovery** `<on/off, retention>` (or
  the daily backups of the plan). Check under Database → Backups.
- **Restore drill, every 3 months**: restore the latest backup into a scratch
  project, run `pnpm ops health 720` against it, and write the date and the
  time it took here: `<date> – <minutes>`.
- Storage (images) is not covered by database backups. The originals stay in
  the media library export and the WordPress backup. Run `pnpm media:sync`
  again to rebuild from originals if needed.

## 6. Daily and weekly checks

**Every morning during the first 7 days, then weekly:**

1. Admin home → **Estado de la web (24 h)**, or `pnpm ops health 24` with
   production env. It exits with code 2 when there is a P0. It checks:
   - seat holds that are no longer released (the `pg_cron` job is down)
   - Redsys notifications with a wrong amount or an unknown order
   - card payments with no confirmation email
   - booking emails that failed or stalled, and form emails that failed
   - the booking funnel: started, paid, abandoned
2. Vercel → Logs: filter `status:500` and `status:404` for the last 24 h. Add
   any legacy URL that 404s to `src/lib/seo/legacy.ts` and `migration/urls.csv`.
3. Resend → Emails: bounces and complaints.
4. Search Console (weekly): coverage, and "Page with redirect".
5. Core Web Vitals (weekly): Search Console → Core Web Vitals, or Lighthouse
   on the home and a tour page. Vercel Speed Insights is not installed;
   adding it is optional (it needs the `@vercel/speed-insights` package and a
   CSP update).

Log each day in `docs/launch/hypercare-log.md`.

## 7. Incidents

| Severity | Meaning | Response |
| --- | --- | --- |
| P0 | Customers cannot book or pay, payments not recorded, data exposed | Fix or roll back within 24 h (aim: same day). Tell customers affected. |
| P1 | A feature is broken but there is a workaround (an email did not go out, a page errors) | Fix before the next weekly review. |
| P2 | Cosmetic or rare | Backlog, with steps to reproduce. |

Common fixes:

- **A customer paid but got no email**: Admin → Reservas → the booking →
  resend confirmation (or `pnpm ops resend <reference> confirmation`).
- **Seat holds not released** (P0 in the health report): Supabase → Database
  → Extensions → check `pg_cron` is on, and that the job
  `release-expired-seat-holds` is listed under Cron. As a stopgap run
  `select public.release_expired_holds();` in the SQL editor.
- **Payment notifications with a wrong amount**: compare the terminal and
  merchant code in Vercel with the bank portal. Do not refund until the bank
  confirms what was charged.
- **Forms stored but no email**: check `OWNER_EMAIL` and the Resend key in
  Vercel. The messages are safe in Admin → Solicitudes.

## 8. Rotating secrets

Rotate when someone with access leaves, after a leak, and once a year.

| Secret | Where it is created | Steps |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY`, anon key | Supabase → Settings → API (rotate JWT secret / API keys) | Rotate, update both in Vercel, redeploy. Signed-in staff must log in again. |
| `REDSYS_SECRET_KEY` | Bank / Redsys portal | Ask the bank for a new key, update Vercel, redeploy, run one live payment. |
| `RESEND_API_KEY` | Resend → API keys | Create the new key, update Vercel, redeploy, delete the old key. |
| `RATE_LIMIT_SALT` | any random string | Update Vercel and redeploy. Counters reset; nothing else happens. |
| Staff passwords | Admin → Equipo / Mi cuenta | Remove people who left; they lose access at once. |

The CI secret scan (gitleaks) fails the pull request if a key is committed.
If that happens, **rotate the key** even after removing it from the code.

## 9. Support contacts

| Topic | Contact |
| --- | --- |
| Site and code | `<developer name, email>` |
| Payments, terminal, refunds | `<bank / Redsys support phone>`, merchant code `<…>` |
| Hosting | Vercel support (dashboard → Help) |
| Database | Supabase support (dashboard → Support) |
| Email delivery | Resend support |
| Domain | `<registrar>` |
