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

## Media pipeline

```bash
pnpm media:sync --dry-run          # what would change
pnpm media:sync                    # download legacy originals, max 2000 px, WebP + AVIF to Storage
pnpm media:sync --source-dir ./wp-uploads   # use local originals instead of downloading
```

Idempotent (already uploaded files are skipped; `--force` redoes them), reports skipped and
failed files and exits non-zero on failures. When a run is clean, set `MEDIA_FROM_STORAGE=true`.
