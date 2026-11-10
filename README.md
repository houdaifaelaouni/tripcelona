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
