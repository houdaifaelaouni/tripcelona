# Tripcelona web

Code-native rebuild of tripcelona.com: Next.js (App Router) on Vercel, Supabase for data, auth and storage. No WordPress in the product.

Planning docs live in [`docs/`](docs): [PRD](docs/PRD-tripcelona-rebuild.md), [execution plan](docs/EXECUTION-PLAN-tripcelona-rebuild.md), [roadmap](docs/ROADMAP-tripcelona-rebuild.md), [scrum plan](docs/SCRUM-PLAN-AND-PROMPTS.md), [decision log](docs/decisions.md). Migration inputs are in [`migration/`](migration).

## Requirements

- Node.js 22+
- pnpm 10 (`corepack enable`)
- Docker (only for the local Supabase stack)

## Setup

```bash
pnpm install
cp .env.example .env.local   # fill in values; never commit them
pnpm dev                     # http://localhost:3000, health check at /health
```

## Commands

| Command                             | What it does                                                 |
| ----------------------------------- | ------------------------------------------------------------ |
| `pnpm dev`                          | Dev server                                                   |
| `pnpm build`                        | Production build                                             |
| `pnpm typecheck`                    | Generate route types, then `tsc --noEmit`                    |
| `pnpm lint`                         | ESLint (Next core-web-vitals + TypeScript + Prettier compat) |
| `pnpm format` / `pnpm format:check` | Prettier                                                     |
| `pnpm supabase start`               | Local Supabase stack (Docker)                                |

## Supabase

Config lives in `supabase/config.toml`, migrations in `supabase/migrations/`, database tests in `supabase/tests/`.

Data model notes:

- RLS is on (and forced) for every table. Visitors only read published content; nobody writes through the anon key. Public forms and checkout write from server code with the service-role client (`src/lib/supabase/admin.ts`).
- Roles live in `profiles.role` (`owner` / `editor`). New auth users get a profile with no role; only an owner can grant one.
- Seats: `hold_seats(departure, qty)` → hold id or `null`; `confirm_hold`, `release_hold`; a pg_cron job releases expired holds every minute. Only the service role can call them.
- `supabase/seed.sql` is **dev data** taken from `migration/content/`. Capacity values are the live-site stock seen on 2026-11-10, not confirmed capacities; see the TODO notes on each departure.

- With Docker: `pnpm supabase start`, then copy the printed URL and anon key into `.env.local`.
- Without Docker: create a separate **dev** Supabase project (never use production), `pnpm supabase link --project-ref <dev-ref>`, and push migrations with `pnpm supabase db push`.

## Vercel

1. Import this repo in Vercel (framework preset: Next.js, install command `pnpm install`).
2. Add env vars from `.env.example` per environment (Preview uses test keys only).
3. Every PR gets a preview URL; check `<preview>/health` returns `{"status":"ok"}`.

Previews send `noindex` until launch (set in `src/app/layout.tsx`).

## CI

- `.github/workflows/ci.yml` runs on every PR: typecheck, lint, format, unit tests, build, then a database job that starts Supabase, resets from migrations + seed, checks generated types are current and runs `pnpm test:db`.
- `.github/workflows/lighthouse.yml` runs mobile Lighthouse against each successful Vercel preview, with budgets in `lighthouserc.json` (performance ≥ 0.9, accessibility ≥ 0.95, LCP ≤ 2.5 s, CLS ≤ 0.1, JS ≤ 200 KB). If Vercel preview protection is on, add a bypass token before this job can reach the preview.

## Design system

Tokens live in `src/app/globals.css` (`@theme`) and map to Tailwind utilities: `bg-navy`, `text-blue`, `border-yellow`, `rounded-card`, `shadow-panel`, `container-site`, and so on. Primitives are in `src/components/ui`; shell content (nav, footer links, contact) is in `src/lib/site.ts`.

## Payments (Redsys) and owner operations

- Checkout → `/reservar/pendiente` (review and pay) → Redsys → `/reservar/confirmada`.
- Redsys' server notification (`POST /api/pagos/redsys/notificacion`) is the only thing
  that confirms a booking; replays are no-ops (`apply_payment_result`, `payment_events`).
- Without `REDSYS_*` env vars, the pay button is replaced by a WhatsApp fallback.
- Without `RESEND_API_KEY`/`EMAIL_FROM`, emails are logged to the server console.

Until the admin UI (Sprint 7), the owner actions run from a terminal with production env:

```bash
pnpm ops resend TC-2026-0001 confirmation   # or owner_alert, payment_failed, cancellation
pnpm ops refund TC-2026-0001                # refund one paid booking and free its seats
pnpm ops cancel-departure <departure-uuid>  # cancel, refund every paid booking, email everyone
```

## Admin (`/admin`)

- Invite-only Supabase Auth. Public sign-up is off (`enable_signup = false`); the owner
  invites people from **Equipo**, and roles live in `profiles.role` (`owner` | `editor`).
- `src/proxy.ts` sends signed-out visitors to `/admin/login`; every admin page and server
  action checks the role again on the server (`requireStaff` / `assertStaff`), and RLS
  enforces the same rules in the database.
- Editors edit tour content. Only the owner sees bookings/customer data, changes dates,
  seats and prices, cancels departures, refunds and manages the team.
- Optional TOTP two-step verification under **Mi cuenta**. Every admin change is written
  to `audit_log`.

First owner (run once with production env):

```bash
pnpm ops grant-staff owner@tu-dominio.com owner            # sends an invite email
pnpm ops grant-staff owner@tu-dominio.com owner 'password' # or sets a password directly
```

Supabase dashboard settings for production: Auth → disable sign-ups, enable TOTP MFA,
Site URL = production domain, add `https://<domain>/admin/auth/confirm` to redirect URLs.

## Content, forms and inbox (Sprint 8)

- **Blog, pages and FAQs** are edited in Admin → Blog / Páginas / Preguntas frecuentes
  (Tiptap editor, stored as JSON and sanitised on save). Draft → preview
  (`/admin/vista-previa/...`) → publish; saving refreshes the public pages
  (`updateTag("content")`). Legal pages (`kind = 'legal'`) can only be changed by the owner,
  and their `[tripola dato="titular|nif|domicilio|email|telefono|web"]` tokens are filled
  from Admin → Ajustes → Datos legales.
- **Media library** (Admin → Medios): uploads are resized to WebP under `library/YYYY/MM`,
  alt text is required, and an image that is still used cannot be deleted (`media_usage()`
  plus a delete trigger). Only the owner deletes.
- **Settings** (Admin → Ajustes, owner): phone, WhatsApp, email, socials, site banner, quote
  extras and legal identity. Header, footer and WhatsApp buttons read them.
- **Forms**: `/contactanos` and `/crea-tu-tour` save to `leads` / `tour_requests` first and
  then email the owner (`OWNER_EMAIL`) and the visitor. A failed email is recorded in
  `email_error` and never loses the submission. Honeypot field plus a per-client limit of
  5 per 10 minutes (`hit_rate_limit()`, salted IP hash, no raw IPs stored).
- **Inbox** (Admin → Solicitudes, owner): quote requests and contact messages with
  status and internal notes.
- **Legacy copy import**: see `migration/README.md`. Owner follow-ups on legal texts:
  `docs/legal/owner-review.md`.

## QA and launch (Sprint 9)

```bash
pnpm e2e:prepare && pnpm build   # e2e data first: tour pages prerender with departures
pnpm e2e                         # Playwright: booking, forms, admin, axe, layout, CSP
pnpm check:urls --base http://localhost:3000 --allow-missing-content   # legacy URL crawl
```

- Legacy URLs: `src/lib/seo/legacy.ts` (checked against `migration/urls.csv` by a unit
  test). `src/proxy.ts` applies them in one 301 hop, answers 410 for WordPress endpoints
  and a real 404 for unknown slugs.
- Security headers: `src/lib/seo/security-headers.ts` (CSP, HSTS on production).
- E2E payments use the fake gateway `tests/e2e/fake-redsys.mjs` (public sandbox key).
  The e2e server must run on the port of `NEXT_PUBLIC_SITE_URL` used at build time,
  because Redsys notifications go there.
- Cutover: `docs/launch/runbook.md`; sign-off: `docs/launch/go-no-go.md`.

## Operations and handover (Sprint 10)

- `pnpm ops health [hours]`: daily health report (stuck seat holds, payment mismatches,
  card payments without confirmation email, failed emails, booking funnel). Exits 2 on a
  P0. The same report is on the owner's admin home.
- `docs/operations.md`: environments, deploys, rollback, backups, incidents, secret rotation.
- `docs/owner-guide.md`: admin guide in Spanish with training exercises.
- `docs/launch/hypercare-log.md`: daily log for the first week.
- `docs/retro-and-backlog.md`: retrospective and proposed 90-day backlog.

## Media pipeline

```bash
pnpm media:sync --dry-run          # what would change
pnpm media:sync                    # download legacy originals, max 2000 px, WebP + AVIF to Storage
pnpm media:sync --source-dir ./wp-uploads   # use local originals instead of downloading
```

Idempotent (already uploaded files are skipped; `--force` redoes them), reports skipped and
failed files and exits non-zero on failures. When a run is clean, set `MEDIA_FROM_STORAGE=true`.
