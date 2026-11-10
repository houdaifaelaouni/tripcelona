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

Config lives in `supabase/config.toml`; migrations go in `supabase/migrations/` from Sprint 2.

- With Docker: `pnpm supabase start`, then copy the printed URL and anon key into `.env.local`.
- Without Docker: create a separate **dev** Supabase project (never use production), `pnpm supabase link --project-ref <dev-ref>`, and push migrations with `pnpm supabase db push`.

## Vercel

1. Import this repo in Vercel (framework preset: Next.js, install command `pnpm install`).
2. Add env vars from `.env.example` per environment (Preview uses test keys only).
3. Every PR gets a preview URL; check `<preview>/health` returns `{"status":"ok"}`.

Previews send `noindex` until launch (set in `src/app/layout.tsx`).
