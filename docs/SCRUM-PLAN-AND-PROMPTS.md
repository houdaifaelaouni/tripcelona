# Tripcelona Rebuild — Scrum Plan & Agent Prompt List

| Field | Value |
|---|---|
| Document | Scrum delivery plan and prompt library |
| Companion | `docs/PRD-tripcelona-rebuild.md`, `docs/EXECUTION-PLAN-tripcelona-rebuild.md`, `docs/ROADMAP-tripcelona-rebuild.md`, `docs/roadmap.d2` |
| Version | 0.1 |
| Date | 10 Nov 2026 |
| Cadence | 10 one-week sprints (W1–W10) |
| Product Goal | Launch a fast, code-native Tripcelona that sells the five tours, keeps every URL alive, and is owner-manageable without code or WordPress |

---

## 1. How to use this document

1. The Product Owner (Ayoub) runs **Sprint Planning** on Monday and pastes the sprint prompt into the build agent.
2. The agent works only on that sprint's stories and reports back using the format in the standing prompt.
3. **Sprint Review** on Friday: demo the Vercel preview against the acceptance criteria.
4. **Retrospective** on Friday: one keep, one stop, one start.
5. Anything not finished goes back to the Product Backlog — it is not silently carried as "done".

The sprint prompts are copy-paste ready. The standing context in §5.1 is prepended to every sprint prompt.

---

## 2. Scrum setup

### 2.1 Product Goal

A production Tripcelona on `tripcelona.com` that:

- loads in under 2.5 s LCP on mobile,
- sells the five existing tours with real departures, capacity and card payment,
- keeps every legacy URL resolving (200 or 301),
- lets the owner manage tours, departures, bookings, blog and legal content from an admin,
- contains **no WordPress, PHP, WooCommerce, Elementor or plugin code**.

### 2.2 Roles

| Role | Who | Responsibilities |
|---|---|---|
| Product Owner | Ayoub | Backlog order, decisions, accepting increments, launch go/no-go |
| Scrum Master | Build agent (facilitator) | Removes blockers, enforces cadence, keeps the board honest |
| Developers | Build agent + any human contributors | Design, build, test, deploy |
| Stakeholders | Collaborators, legal reviewer | Content, legal sign-off, feedback at review |

### 2.3 Cadence and ceremonies

| Ceremony | When | Duration | Output |
|---|---|---|---|
| Sprint Planning | Monday | 30 min | Sprint goal, committed stories, prompt run |
| Daily stand-up | Async, daily | 10 min | Done / next / blockers |
| Backlog refinement | Wednesday | 30 min | Next sprint's stories meet Definition of Ready |
| Sprint Review | Friday | 30 min | Demo vs acceptance criteria; accept or reject |
| Retrospective | Friday | 15 min | One improvement action for the next sprint |

### 2.4 Artifacts

- **Product Backlog** — every story in §3, ordered by value and dependency.
- **Sprint Backlog** — the stories committed in §4 plus the sprint goal.
- **Increment** — a deployable Vercel preview at the end of every sprint; production from Sprint 9.
- **Definition of Done** — §2.6.

### 2.5 Estimation and velocity

- Fibonacci points: 1, 2, 3, 5, 8. One point is relative, not a fixed number of hours.
- Initial forecast: **15–20 points per sprint** for agent-assisted delivery with owner review.
- Velocity is re-baselined after Sprint 2 using actual completed points; the forecast and launch date are updated then, not argued about.
- If a story is larger than 5 points, split it before committing.

### 2.6 Definition of Ready

A story can enter a sprint only when it has:

- a story ID and one-sentence user story,
- acceptance criteria,
- the data it needs (real content or a clearly marked placeholder),
- no unresolved dependency on a later story,
- a size of 5 points or less.

### 2.7 Definition of Done

- Code merged, typecheck, lint and build pass.
- Acceptance criteria verified on the Vercel preview.
- Tests added or updated where logic exists (price, capacity, validation, redirects).
- Works at 360 px and 1440 px; keyboard accessible; no console errors.
- Analytics event verified when the story is user-facing and instrumented.
- No secrets committed; new env vars added to `.env.example`.
- Product Owner has seen the increment (for user-facing stories).

---

## 3. Product backlog

Ordered by delivery sequence. Points are initial estimates.

### Epic A — Discovery and content (Sprint 1)

| ID | User story | Pts | Sprint | Ref |
|---|---|---|---|---|
| US-01 | As the Product Owner, I want decisions D1–D3 closed so the build does not stall on unknowns. | 1 | S1 | PRD §14 |
| US-02 | As the build team, I want a complete content pack per tour so pages are built with real data. | 3 | S1 | Plan 0.5 |
| US-03 | As the team, I want an inventory of every legacy URL so redirects are planned before launch. | 2 | S1 | Plan 0.4 |
| US-04 | As the team, I want access and brand assets so environment and design work can start. | 1 | S1 | Plan 0.2 |

### Epic B — Platform foundation (Sprints 1–3)

| ID | User story | Pts | Sprint | Ref |
|---|---|---|---|---|
| US-05 | As a developer, I want a deployable Next.js skeleton with preview environments so every change is reviewable. | 3 | S1 | Plan 1.1–1.2 |
| US-06 | As a developer, I want the full Postgres schema in migrations so data is reproducible from scratch. | 5 | S2 | PRD §8 |
| US-07 | As the owner, I want RLS and role checks so public users can never write data. | 2 | S2 | PRD §9.4 |
| US-08 | As the owner, I want atomic seat holds so departures cannot be oversold. | 3 | S2 | FR-31 |
| US-09 | As a developer, I want seed data for the five tours so every page can render real content. | 2 | S2 | Plan 1.6 |
| US-10 | As a developer, I want CI with typecheck, lint, tests and Lighthouse so regressions are caught on the PR. | 2 | S3 | Plan 1.7 |

### Epic C — Design system and shell (Sprint 3)

| ID | User story | Pts | Sprint | Ref |
|---|---|---|---|---|
| US-11 | As a visitor, I want a consistent visual system so the site feels trustworthy and matches the Booking.com-inspired direction. | 3 | S3 | PRD App. B |
| US-12 | As a visitor, I want a clear header, footer and error states so I can navigate from any page. | 3 | S3 | FR-03, FR-04, FR-74 |
| US-13 | As a visitor, I want a full-bleed hero with search so I can start choosing a trip immediately. | 3 | S3 | FR-01, FR-02 |

### Epic D — Catalog and tour pages (Sprints 4–5)

| ID | User story | Pts | Sprint | Ref |
|---|---|---|---|---|
| US-14 | As a visitor, I want to filter tours by area, month, duration and price so I can find the right day trip. | 5 | S4 | FR-10–FR-12 |
| US-15 | As a visitor, I want a complete tour page with itinerary, inclusions and meeting point so I can decide to book. | 5 | S4 | FR-20–FR-23 |
| US-16 | As a visitor, I want to pick a departure date and see seats left so I know what is available. | 3 | S5 | FR-23, FR-24 |
| US-17 | As a search engine, I want metadata, structured data and a sitemap so tours are indexed correctly. | 3 | S5 | FR-28, FR-94, FR-95 |

### Epic E — Booking and payments (Sprints 5–7)

| ID | User story | Pts | Sprint | Ref |
|---|---|---|---|---|
| US-18 | As a visitor, I want a guest checkout with clear validation so I can book without an account. | 3 | S5 | FR-30 |
| US-19 | As a visitor, I want to pay by card securely so my booking is confirmed instantly. | 5 | S6 | FR-32 |
| US-20 | As the owner, I want webhook-driven confirmation so a payment is never lost or double-counted. | 3 | S6 | FR-32, FR-33 |
| US-21 | As a visitor, I want a confirmation email with the meeting point and what to bring so I am ready for the trip. | 2 | S6 | FR-33, FR-92 |
| US-22 | As the owner, I want to cancel a departure and refund bookings so I can handle operational changes. | 2 | S6 | FR-35 |
| US-23 | As the owner, I want a concurrency test proving no oversell so I trust the booking system. | 2 | S7 | FR-31 |

### Epic F — Admin / CMS (Sprints 7–9)

| ID | User story | Pts | Sprint | Ref |
|---|---|---|---|---|
| US-24 | As the owner, I want invite-only admin login with roles so only authorised people can change data. | 2 | S7 | FR-80 |
| US-25 | As the owner, I want to manage tours, departures, capacity and prices so I never need a developer for updates. | 5 | S7 | FR-81 |
| US-26 | As the owner, I want to see bookings, take manual bookings and resend emails so I can run operations. | 3 | S7 | FR-82 |
| US-27 | As the owner, I want a media library with alt text so images are reusable and accessible. | 2 | S8 | FR-87 |
| US-28 | As the editor, I want to write and publish blog posts and pages with preview so content ships without a deploy. | 5 | S8 | FR-83 |
| US-29 | As the owner, I want a quote inbox and editable site settings so group requests and contact details are managed in one place. | 4 | S8 | FR-84, FR-86 |

### Epic G — Content, migration and legal (Sprints 7–9)

| ID | User story | Pts | Sprint | Ref |
|---|---|---|---|---|
| US-30 | As the team, I want a repeatable media pipeline so every image is optimised and stored consistently. | 2 | S7 | Plan 6.1 |
| US-31 | As the team, I want all legacy copy imported and sanitised so the preview is content-complete. | 3 | S8 | Plan 6.2 |
| US-32 | As the owner, I want the five legal pages migrated and the cookie policy updated so the site is compliant. | 2 | S8 | FR-73 |
| US-33 | As the owner, I want every old URL to resolve or 301 so search traffic is preserved. | 3 | S9 | PRD §10 |
| US-34 | As a visitor, I want working contact and quote forms in Spanish so I can reach the team. | 2 | S8 | FR-40–FR-43, FR-72 |

### Epic H — QA and launch (Sprint 9)

| ID | User story | Pts | Sprint | Ref |
|---|---|---|---|---|
| US-35 | As the team, I want end-to-end tests for booking, forms and admin so releases are safe. | 4 | S9 | Plan §14 |
| US-36 | As a visitor, I want the site to work on my phone and with a keyboard so I can book from anywhere. | 3 | S9 | NFR accessibility |
| US-37 | As a visitor, I want fast pages so I do not abandon the booking. | 2 | S9 | NFR performance |
| US-38 | As the owner, I want the security checklist passed so data and payments are protected. | 2 | S9 | PRD §9.4 |
| US-39 | As the owner, I want a final SEO crawl so no legacy URL is lost at launch. | 1 | S9 | PRD §10 |
| US-40 | As the owner, I want a rehearsed cutover so launch is reversible and monitored. | 5 | S9 | Plan §11 |

### Epic I — Hypercare and handover (Sprint 10)

| ID | User story | Pts | Sprint | Ref |
|---|---|---|---|---|
| US-41 | As the owner, I want daily monitoring and fast fixes in the first week so launch issues do not linger. | 5 | S10 | Plan §11 |
| US-42 | As the owner, I want training and a runbook so I can operate the site independently. | 2 | S10 | Plan §11 |
| US-43 | As the team, I want a retrospective and a 90-day backlog so the next phase is prioritised. | 1 | S10 | PRD §17 |

**Total: 124 points.**

---

## 4. Sprint plan at a glance

| Sprint | Week | Sprint goal | Stories | Pts | Gate / milestone | Demo |
|---|---|---|---|---|---|---|
| S1 | W1 | Scope locked, content captured, skeleton standing | US-01–05 | 10 | G1 | Decision log, URL CSV, preview `/health` |
| S2 | W2 | Data foundation ready | US-06–09 | 12 | G2 (schema) | Schema reset, RLS tests, seeded tours |
| S3 | W3 | Shell approved | US-10–13 | 11 | G2 (design) | Header, footer, hero, CI checks |
| S4 | W4 | Catalog and tour pages on preview | US-14–15 | 10 | M3 | Filterable catalog, five tour pages |
| S5 | W5 | Departure selection, SEO, checkout form | US-16–18 | 9 | M3/M4 | Date picker, valid schema, checkout form |
| S6 | W6 | Booking works end to end in test mode | US-19–22 | 12 | G3 prep | Test payment, webhook, emails, refund |
| S7 | W7 | Admin core and media pipeline | US-23–26, US-30 | 14 | M5 (partial) | Tours/departures admin, bookings admin |
| S8 | W8 | Admin complete, content imported, legal done | US-27–29, US-31, US-32, US-34 | 18 | M5/M6 | Owner walkthrough, content-complete preview |
| S9 | W9 | QA signed off and launch | US-33, US-35–40 | 20 | G4 / M7–M8 | E2E green, Lighthouse, live domain |
| S10 | W10 | Hypercare and handover | US-41–43 | 8 | M9 | Stable week, training, retro |

**Release note:** Sprint 9 is deliberately the hardening and release sprint. If the Sprint 8 review shows any open P0/P1, launch moves to Sprint 10 and hypercare extends into Week 11. The Product Owner decides at the review; scope is never silently cut. The cut order, if needed: English locale → reviews module → event ticketing → newsletter. Never cut payments, legal, consent or redirects.

---

## 5. Agent prompts

### 5.1 Standing context (prepend to every sprint prompt)

```text
You are the build agent for the Tripcelona rebuild, working in this repository.

Read before starting:
- docs/PRD-tripcelona-rebuild.md
- docs/EXECUTION-PLAN-tripcelona-rebuild.md
- docs/ROADMAP-tripcelona-rebuild.md
- docs/SCRUM-PLAN-AND-PROMPTS.md (this sprint's section)

Product goal: a fast, code-native Tripcelona that sells the five existing tours, keeps every existing URL alive, and lets the owner manage tours, departures, bookings and content without code.

Stack and constraints:
- Next.js App Router + TypeScript strict + Tailwind v4 on Vercel.
- Supabase for Postgres, Auth and Storage; Stripe for payments; Resend for email.
- No WordPress, PHP, WooCommerce, Elementor or plugin code in the product.
- Do not invent business facts: prices, departure dates, policies, legal text, reviews or translations. If data is missing, use a clearly marked TODO and report it as a blocker.
- Stay inside this sprint's stories. New ideas go to the product backlog, not the sprint.

Quality bar:
- Typecheck, lint and build pass; relevant tests pass.
- Works at 360 px and 1440 px; keyboard accessible; no console errors.
- No secrets in the repo; every new env var is documented in .env.example.

At the end report:
1. Stories completed (IDs) with evidence for each acceptance criterion.
2. Files changed.
3. Commands run and their results (including failures).
4. Blockers and decisions needed from the Product Owner.
5. Suggested focus for the next sprint.
```

### 5.2 Sprint 1 — Scope locked, content captured, skeleton standing

**Goal:** close decisions, capture real content and URLs, stand up the repo and preview.

```text
Sprint 1 — Scope locked, content captured, skeleton standing (Week 1)

Stories: US-01, US-02, US-03, US-04, US-05.

Do:
1. Create docs/decisions.md with D1–D3: payment provider (Stripe vs PayTPV/Redsys), launch languages, events scope. Record the chosen option, owner and date. If the owner has not chosen, mark OPEN with the options and recommendation — do not decide alone.
2. Create migration/urls.csv with every URL in PRD §5.2 plus any sitemap URLs you can reach, and a proposed action for each: keep, 301, or retire.
3. Create migration/content/ with one markdown file per tour: current copy, a missing-fields checklist (departures, capacity, price, inclusions, meeting point, images, alt text) and an image inventory.
4. Scaffold the app: Next.js App Router, TypeScript strict, Tailwind v4, ESLint/Prettier, pnpm; a /health route; .env.example; README with setup and run commands.
5. Configure the Vercel project and Supabase project files. Do not commit secrets. If Docker is unavailable for local Supabase, document the workaround and use a dev project.

Acceptance:
- docs/decisions.md exists and is linked from the PRD.
- migration/urls.csv covers the PRD page list.
- Five tour files exist with the missing-fields section filled in.
- pnpm build and typecheck pass; the preview deployment renders /health.
```

### 5.3 Sprint 2 — Data foundation

**Goal:** schema, security, seat holds and seed data that every later story builds on.

```text
Sprint 2 — Data foundation (Week 2)

Stories: US-06, US-07, US-08, US-09.

Do:
1. Write SQL migrations for every table in PRD §8: tours, tour_departures, tour_images, tour_itinerary, tour_faqs, bookings, booking_travellers, payments, tour_requests, events, posts, pages, faqs, reviews, media, settings, redirects, leads, audit_log. Include primary keys, foreign keys, indexes, updated_at triggers.
2. Enable RLS on every table: public read only for published content; anonymous users cannot write; admin writes require the owner/editor role.
3. Implement hold_seats(departure_id, qty): atomic UPDATE that cannot exceed capacity, plus an expiry/release path for abandoned checkouts.
4. Seed the five tours, sample departures, FAQs and settings from migration/content. Mark unknown prices/dates as TODO, not invented values.
5. Add generated database types and typed Supabase clients for server and browser.

Acceptance:
- supabase db reset rebuilds the schema from scratch.
- RLS tests prove anonymous writes fail and published reads succeed.
- A 10-parallel hold test on one seat yields exactly one success.
- Seeded catalog shows five tours with at least one departure each.
```

### 5.4 Sprint 3 — Shell and design system

**Goal:** the public shell and UI primitives, with CI guarding every later sprint.

```text
Sprint 3 — Shell and design system (Week 3)

Stories: US-10, US-11, US-12, US-13.

Do:
1. CI workflow: install, typecheck, lint, unit tests and build on every PR; a Lighthouse budget job on the preview URL for home and one tour page.
2. Design tokens from PRD Appendix B (navy #003580, yellow #feba02, blue #0071c2, borders #e7e7e7/#bdbdbd, radii 4/8/12) and Tailwind theme mapping.
3. Primitives: Button, Input, Select, Card, Badge, Accordion, Dialog, Tabs — with focus-visible states and disabled states.
4. Header (desktop + mobile drawer, cart count, phone/WhatsApp), footer (nav, legal, contact, schedule), 404, loading and error states, skip link.
5. Hero: full-bleed video with poster, gradient overlay, H1, and the search widget (tabs Excursiones / Grupos y Empresas, destination select, date/group size, CTA). Respect prefers-reduced-motion and avoid layout shift.

Acceptance:
- CI is green and the Lighthouse job reports budgets.
- Shell matches the design direction; keyboard navigation and focus states pass a manual check.
- Hero shows the poster before video load and does not shift layout.
```

### 5.5 Sprint 4 — Catalog and tour detail

**Goal:** the SEO-critical browsing experience, driven entirely by Supabase.

```text
Sprint 4 — Catalog and tour detail (Week 4)

Stories: US-14, US-15.

Do:
1. Catalog page /ofertas-de-viajes with server-side filters: area, month, duration, price range and group type. Filters live in the URL and survive refresh/back.
2. Tour cards showing image, title, area, duration, price-from and next departure; empty state with WhatsApp CTA.
3. Tour detail page /excursiones/[slug]: gallery, title, area, duration, difficulty, price, highlights, day-by-day itinerary, inclusions/exclusions, packing list, meeting point with map link.
4. Related tours and per-tour FAQ accordion.
5. All content from Supabase; no hardcoded tours.

Acceptance:
- Five tours render from the database.
- Filter combinations are shareable and return correct results.
- Tour pages pass a mobile layout check at 360 px; images use next/image with explicit dimensions.
```

### 5.6 Sprint 5 — Departure picker, SEO and checkout form

**Goal:** date selection, indexable metadata and the first half of the booking flow.

```text
Sprint 5 — Departure picker, SEO and checkout form (Week 5)

Stories: US-16, US-17, US-18.

Do:
1. Departure picker on the tour page: open departures only, seats left, sold-out disabled with a label, selection persisted into checkout.
2. Metadata, canonical URLs, OG images, JSON-LD (Product or TouristTrip + Offer, FAQPage, BreadcrumbList), sitemap.xml and robots.txt generated from the database.
3. Checkout form /reservar: name, email, phone, travellers, pickup note, terms acceptance. Zod validation; price recalculated on the server from the departure, never trusted from the client.
4. Handle the no-departure and sold-out states with a clear next step (WhatsApp or other dates).

Acceptance:
- Selecting a date carries through to checkout with the correct price.
- Rich Results test validates tour and FAQ schema.
- Server rejects a tampered price or invalid traveller count.
- Sitemap includes every published tour and post.
```

### 5.7 Sprint 6 — Payments and booking confirmation

**Goal:** a booking that can be paid, confirmed and refunded.

```text
Sprint 6 — Payments and booking confirmation (Week 6)

Stories: US-19, US-20, US-21, US-22.

Do:
1. Payment integration (Stripe Payment Element or Checkout; Redsys redirect only if D1 requires it): create the payment intent/order from the server, handle 3DS, return to the confirmation route.
2. Webhook handler: verify the signature, store the raw event idempotently, transition booking status pending → paid, write the payment row. Replaying the same event must not duplicate anything.
3. Confirmation page with a human-readable reference (TC-YYYY-NNNN) and an .ics calendar file.
4. Emails via Resend: customer confirmation (date, meeting point, what to bring, reference), owner alert, payment failure notice. Idempotent send and a resend action.
5. Admin cancel/refund path: cancel a departure, refund affected bookings through the provider, update statuses.

Acceptance:
- A test card completes a booking and the confirmation email arrives (check spam too).
- Webhook replay produces no duplicate booking or payment.
- Refund updates the booking and is visible in the provider dashboard.
- No secret key is present in client code.
```

### 5.8 Sprint 7 — Admin core and media pipeline

**Goal:** the owner can run tours and bookings; images get a repeatable pipeline.

```text
Sprint 7 — Admin core and media pipeline (Week 7)

Stories: US-23, US-24, US-25, US-26, US-30.

Do:
1. Concurrency test: 10 parallel checkouts on a departure with 1 seat; exactly one succeeds, the rest get a clear sold-out response. Add it to CI.
2. Admin auth: Supabase invite-only users, owner/editor roles, middleware and server-side role checks, MFA available.
3. Tours and departures admin: create/edit tours, departures, capacity, prices, status; publishing revalidates the public pages within 60 seconds.
4. Bookings admin: list and detail, manual booking, resend confirmation, trigger refund.
5. Media pipeline script: download legacy originals, resize to max 2000 px, convert to AVIF/WebP, upload to Supabase Storage with stable paths and alt-text placeholders.

Acceptance:
- The concurrency test passes consistently.
- Signed-out users are redirected from /admin; editors cannot access owner-only actions.
- A price change in admin appears on the public tour page after revalidation.
- Media script is idempotent and reports skipped/failed files.
```

### 5.9 Sprint 8 — Admin complete and content imported

**Goal:** owner independence and a content-complete preview.

```text
Sprint 8 — Admin complete and content imported (Week 8)

Stories: US-27, US-28, US-29, US-31, US-32, US-34.

Do:
1. Media library: upload, alt text, search, guarded delete.
2. Blog and pages editor (Tiptap JSON): draft/publish, preview, cover image, SEO title/description, revalidation on publish.
3. Quote requests inbox with statuses (new, quoted, won, lost) and notes; editable site settings for phone, WhatsApp, email and socials.
4. Import all legacy copy into Supabase: tours, posts, pages, FAQs. Sanitise HTML once, fix internal links, keep tables/lists, no placeholder content.
5. Migrate the five legal pages verbatim; update the cookie policy for Supabase, Vercel, Stripe and Resend.
6. Contact and quote forms: store in DB, send notification and auto-reply, honeypot and rate limiting, Spanish strings.

Acceptance:
- Owner completes a scripted walkthrough: publish a post, edit a price, add a departure, answer a quote.
- No page contains lorem ipsum or invented prices.
- Legal pages render and are linked from the footer.
- Forms store submissions even when email delivery fails.
```

### 5.10 Sprint 9 — QA, redirects and launch

**Goal:** verified quality, preserved SEO and a reversible cutover.

```text
Sprint 9 — QA, redirects and launch (Week 9)

Stories: US-33, US-35, US-36, US-37, US-38, US-39, US-40.

Do:
1. Redirect map for every old URL in migration/urls.csv, implemented in next.config or middleware; a CI crawl asserts 200/301 and reports unexpected 404s.
2. Playwright e2e: home → catalog → tour → checkout (test card) → confirmation; quote form; contact form; admin login and publish.
3. Device and browser pass: iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari at 360, 768 and 1440 px.
4. Accessibility: axe on key pages, zero critical issues; manual keyboard and screen-reader smoke test.
5. Performance: Lighthouse mobile ≥ 90 on home and tour; LCP ≤ 2.5 s; initial JS ≤ 200 KB gzip.
6. Security: RLS tests, rate-limit checks, CSP/HSTS, webhook signature verification, secret scan.
7. Launch runbook: content freeze, backups, TTL 300 s, production env vars, live payment test, DNS cutover, sitemap submission, monitoring and rollback rehearsal.

Acceptance:
- Every URL in migration/urls.csv returns 200 or 301 on production.
- E2E suite is green in CI.
- No P0/P1 open; go/no-go checklist signed by the Product Owner.
- Live card payment and confirmation email verified on the real domain.
```

### 5.11 Sprint 10 — Hypercare and handover

**Goal:** a stable first week and an owner who can operate without the agent.

```text
Sprint 10 — Hypercare and handover (Week 10)

Stories: US-41, US-42, US-43.

Do:
1. Daily checks for seven days: error rate, failed payments, email delivery, 404s, Core Web Vitals, booking funnel.
2. Fix P0 issues within 24 hours; log P1/P2 into the backlog with reproduction steps.
3. Owner training: admin walkthrough, booking/refund handling, content publishing, reading analytics.
4. Write the operations runbook: environments, deploy, rollback, backups/restore, secrets rotation, support contacts.
5. Retrospective: what worked, what did not, and the prioritized 90-day backlog (EN locale, booking lookup, reviews, invoicing, waitlist, A/B test).

Acceptance:
- Seven days of monitoring with no unresolved P0.
- Owner completes the admin tasks unaided.
- Runbook reviewed and stored in the repo.
- Retro actions and 90-day backlog agreed with the Product Owner.
```

### 5.12 Sprint review prompt (run every Friday)

```text
Sprint review — [sprint number]

Compare the increment on the preview against this sprint's acceptance criteria.

For each committed story:
- Status: done / partially done / not done.
- Evidence: URL, screenshot, test output or command result.
- Gaps: what is missing and why.

Then report:
- Sprint goal met? Yes/no, with one sentence of evidence.
- Points completed vs committed.
- Defects found, with severity (P0 blocks launch, P1 fix before next review, P2 backlog).
- Decisions needed from the Product Owner.
- Recommendation for the next sprint (continue, re-plan, or pull scope).
```

### 5.13 Retrospective prompt (run every Friday)

```text
Retrospective — [sprint number]

Answer briefly:
1. Keep: what worked well and should continue.
2. Stop: what wasted time or created risk.
3. Start: one concrete change for the next sprint.
4. Velocity: points completed vs committed; if three sprints trend below plan, propose a re-forecast or scope cut.
5. One action with an owner and a due date.
```

---

## 6. Release forecast and change control

- Backlog size: **124 points** across 10 sprints.
- Planning velocity: 15–20 points per sprint with agent-assisted delivery. Re-baseline after Sprint 2.
- If average velocity is below 12 points by the Sprint 3 review, the Product Owner chooses: extend the timeline by one sprint, or cut from the agreed order (English locale → reviews → event ticketing → newsletter). Payments, legal, consent and redirects are never cut.
- New requests are written as backlog stories with a size and a trade-off ("this replaces X or moves launch by Y"). They do not enter an active sprint.
- Sprint scope is frozen after Planning; emergencies are handled as a swap, not an addition.

---

## 7. Impediments to watch

| Impediment | Sprint | Scrum response |
|---|---|---|
| Content pack incomplete | S1–S2 | Story blocked at Review; PO supplies data or accepts a marked TODO |
| Payment decision open | S1, S6 | G1 gate; if open, build the Stripe path and document the Redsys delta |
| Supabase local Docker unavailable | S2 | Use a dev project; record the workaround in the README |
| Legal review late | S8 | Legal pages ship verbatim; cookie policy update tracked as a P1 |
| QA finds P0 in S9 | S9 | Launch moves to S10; hypercare extends to Week 11 |
| Scope creep (EN, accounts, ticketing) | All | Backlog only; PO re-orders at refinement |

---

## 8. Launch definition (Scrum "done" for the product)

The product is done when the PRD §15 checklist passes and the Product Owner accepts the increment at the Sprint 9 review:

- all public pages content-complete on mobile and desktop,
- live card payment and confirmation email verified,
- no oversell under concurrent checkout,
- old URLs resolve or 301, sitemap submitted,
- Lighthouse ≥ 90 performance and ≥ 95 accessibility on home and one tour,
- legal, consent and analytics behave correctly,
- owner can publish a price change without a deploy,
- backups, monitoring and rollback rehearsed.
