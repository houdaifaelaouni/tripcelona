# Tripcelona Rebuild — Roadmap

| Field | Value |
|---|---|
| Document | Delivery roadmap |
| Companion | `docs/PRD-tripcelona-rebuild.md`, `docs/EXECUTION-PLAN-tripcelona-rebuild.md` |
| Version | 0.1 |
| Date | 10 Nov 2026 |
| Horizon | 9 weeks to launch + 1 week hypercare + 90-day post-launch plan |
| Stack | Next.js on Vercel + Supabase, Stripe, Resend — **no WordPress in the product** |

Visual versions: [`roadmap.png`](roadmap.png) · [`roadmap.svg`](roadmap.svg) · editable source: [`roadmap.d2`](roadmap.d2)

---

## 1. North star

**Launch a fast, code-native Tripcelona that sells the same five tours, keeps every existing URL alive, and lets the owner manage departures, prices, bookings and content without touching code or a page builder.**

"Launched" means: production on the real domain, live card payment working, confirmation emails delivered, redirects verified, legal/consent in place, and the owner able to publish a price change in under 10 minutes.

---

## 2. Timeline at a glance

Ten-week view. Build happens weeks 1–8, launch lands in week 9, hypercare and buffer in week 10.

| Workstream | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | W9 | W10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Discovery & content | ■ | ■ | | | | | | | | |
| Foundation & schema | ■ | ■ | | | | | | | | |
| Design system & shell | | ■ | ■ | | | | | | | |
| Catalog & tour pages | | | ■ | ■ | | | | | | |
| Booking & payments | | | | ■ | ■ | | | | | |
| Admin / CMS | | | | | | ■ | | | | |
| Content migration & legal | | | | | | ■ | ■ | | | |
| QA & hardening | | | | | | | ■ | ■ | | |
| Launch & hypercare | | | | | | | | | ■ | ■ |

Calendar is relative to kickoff (week 1 = first working week). With two developers the build compresses to ~6 weeks; the sequence stays the same.

---

## 3. Milestones

Each milestone is a reviewable demo on a Vercel preview, not a status report.

| # | Milestone | Target | Deliverable | Exit criteria |
|---|---|---|---|---|
| M0 | Scope locked | End W1 | Signed PRD, closed decisions, content pack, URL inventory | D1–D3 decided; tours/departures data received; old URL list complete |
| M1 | Foundation ready | End W2 | Repo, CI, Supabase schema + RLS, seeded data, preview deploys | App reads the 5 tours from Supabase; migrations reproducible; CI green |
| M2 | Shell approved | End W2 | Design tokens, header, footer, hero, UI primitives | Design sign-off on desktop + mobile; keyboard/focus pass |
| M3 | Catalog live on preview | End W4 | Catalog with filters, 5 tour pages, metadata + schema | All tours render from DB; filters shareable; Rich Results valid |
| M4 | Booking works | End W5 | Checkout, seat holds, payment (test), emails, confirmation | Test card completes; webhook idempotent; no oversell in concurrency test |
| M5 | Admin ready | End W6 | Tours/departures, bookings, blog/pages, media, quote inbox | Owner completes scripted walkthrough without developer help |
| M6 | Content complete | End W7 | Migrated copy, media, legal pages, redirects | No placeholder content; redirect crawl green on old URL list |
| M7 | QA sign-off | End W8 | E2E suite, performance, accessibility, security, SEO checks | No P0/P1 open; Lighthouse ≥ 90 mobile; budgets met |
| M8 | **Launch** | W9 | Production deploy, DNS cutover, monitoring | Live payment + email + redirects + sitemap verified on the real domain |
| M9 | Hypercare exit | End W10 | Handover, runbook, first performance/funnel review | Owner self-sufficient; incidents closed; rollback still available |

---

## 4. Phase-by-phase plan

### Weeks 1–2 — Discovery, foundation, shell

**Focus:** remove ambiguity, stand up the skeleton, agree the look.

- Close payment (Stripe vs PayTPV/Redsys), languages (ES at launch) and events scope (listing + CTA).
- Extract legacy content once — or skip the export and enter content directly in the new admin. WordPress is not part of the build.
- Set up repo, Vercel preview/production, Supabase schema/RLS/`hold_seats`, seed data, CI.
- Build tokens, primitives, header/footer/hero shell.

**Demo at end of W2:** preview URL with the new shell and real tours listed.
**Risk:** slow content pack. Mitigation: seed with the five known tours and placeholder-free copy from the live site, then reconcile.

### Weeks 3–4 — Catalog and tour pages

**Focus:** the SEO-critical surface.

- Catalog with URL-state filters (area, month, duration, price).
- Tour pages: gallery, highlights, itinerary, inclusions, meeting point, departure picker, FAQs.
- Metadata, canonical, OG images, JSON-LD, sitemap/robots.

**Demo at end of W4:** browse → filter → open tour → pick a date (no payment yet).
**Risk:** thin tour data (capacity, inclusions). Mitigation: schema requires the fields; gaps block M3.

### Weeks 4–5 — Booking and payments

**Focus:** the revenue path.

- Checkout with server-side price recomputation.
- Atomic seat holds + expiry; payment integration; webhook as source of truth.
- Confirmation page, `.ics`, customer and owner emails.
- Concurrency test (10 parallel checkouts, 1 seat).

**Demo at end of W5:** full test-mode booking with confirmation email.
**Risk:** payment contract forces Redsys. Mitigation: decide in W1; prototype redirect flow early (+4–6 d).

### Week 6 — Admin

**Focus:** owner independence.

- Auth + roles, tours/departures management, bookings/refunds/resend, blog/pages editor, media library, quote inbox, settings.
- Revalidation so public pages update within a minute of publishing.

**Demo at end of W6:** owner creates a departure and publishes a post live on preview.

### Weeks 6–7 — Content, migration, legal

**Focus:** parity.

- Import/normalise all copy, media pipeline (resize/convert/upload), internal links.
- Legal pages migrated; cookie policy updated for Supabase/Vercel/Stripe/Resend.
- Redirect map implemented and crawled in CI.
- Spanish UI strings; English scaffolding only.

**Demo at end of W7:** content-complete preview, redirect crawl green.

### Weeks 7–8 — QA and hardening

**Focus:** confidence.

- Playwright: booking, quote, contact, admin publish.
- Device/browser pass (iOS Safari, Android Chrome, desktop).
- Accessibility (axe + keyboard/screen reader smoke), performance budgets, security checklist (RLS, rate limits, CSP, webhook auth), SEO crawl.

**Gate:** go/no-go at end of W8.

### Week 9 — Launch

- T-2 d: content freeze, backups, final URL export.
- T-1 d: TTL 300 s, production deploy, smoke test with `noindex`.
- T-0: remove `noindex`, switch DNS, verify TLS, booking, emails, sitemap, analytics consent.
- T+1 d: Search Console coverage, 404 watch, redirect fixes.

### Week 10 — Hypercare

- Daily error/booking/email checks; fix redirect misses.
- Performance and funnel review; owner handover and runbook sign-off.
- Keep WordPress read-only until T+30, then decommission.

---

## 5. Critical path

```
Content pack ──► schema ──► tour pages ──► checkout ──► live payments ──► QA ──► DNS
      │                          │
      └──► media/legal ──► content import ──► redirects ──┘
```

Anything that delays the content pack or the payment decision moves the launch date. Design polish, English, ticketing and accounts do not sit on the critical path and should not block M8.

---

## 6. Decision gates

| Gate | When | Decisions | Owner |
|---|---|---|---|
| G1 Scope | End W1 | D1 payment, D2 languages, D3 events, launch date | Ayoub |
| G2 Design & schema | End W2 | Shell approved, data model frozen | Ayoub + dev |
| G3 Payment go-live | End W5 | Live keys, settlement, refund policy confirmed | Ayoub |
| G4 Launch go/no-go | End W8 | QA sign-off, content freeze, rollback plan | Ayoub + dev |
| G5 Post-launch review | End W10 | Hypercare exit, 90-day priorities | Ayoub + dev |

---

## 7. Owner responsibilities by week

| Week | Needed from owner |
|---|---|
| W1 | Access (domain, hosting, Search Console, GA4, payment account); decisions D1–D3; brand assets |
| W2 | Tour details: departures, capacity, prices, meeting point, inclusions |
| W3 | Legal entity data (NIF, address), cancellation policy confirmation |
| W4 | Review quotes with permission; final tour imagery |
| W5 | Payment account live-mode approval, refund rules |
| W6 | Admin walkthrough feedback |
| W7 | Final copy review, legal sign-off |
| W8 | Go/no-go; launch comms plan |
| W9–W10 | Availability for launch window and hypercare issues |

---

## 8. Risks on the timeline

| Risk | Hits | Mitigation |
|---|---|---|
| Content pack late | W2–W4 | Seed from live site; weekly 30-min review; gaps block milestone, not launch |
| PayTPV/Redsys mandated | W4–W5 | Decide W1; add 4–6 d and a redirect-flow spike |
| Holiday period slows approvals | W5–W7 | Freeze scope before holidays; async approvals; buffer in W10 |
| Redirect misses | W7–W9 | URL inventory + CI crawl + Search Console monitoring |
| Email deliverability | W5, W9 | SPF/DKIM/DMARC set up early in W3, test to Gmail/Outlook |
| Scope creep (EN, accounts, ticketing) | All | Non-goals list; change request per addition; post-launch backlog |

---

## 9. Post-launch 90 days

**Days 0–30 — Stabilise**
- Monitor errors, bookings, email delivery, Core Web Vitals.
- Fix redirect/SEO issues; submit sitemap; review Search Console weekly.
- Collect owner feedback on admin; small UX fixes.
- Start human English translation of tours and key pages.

**Days 30–60 — Expand**
- Launch `/en` with reviewed translations and hreflang.
- Booking lookup by reference (no account).
- Post-trip review collection flow.
- Newsletter capture + first campaign.

**Days 60–90 — Optimise**
- Automated invoicing (Stripe Invoicing or external).
- Waitlist for sold-out departures.
- A/B test hero CTA and search defaults.
- Evaluate event ticketing only if volume justifies it.

Success check at day 90: booking conversion vs pre-launch baseline, organic sessions ≥ 95% of baseline, LCP ≤ 2.5 s p75, zero unresolved redirect 404s.

---

## 10. How progress is tracked

- **Weekly:** 30-minute review on the preview URL — demo, decisions, risks, next week.
- **Daily (build weeks):** async standup note — done, next, blockers.
- **Board:** one column per milestone (M0–M9); tickets from the execution plan backlog.
- **Definition of done:** merged, typed, tested where logic exists, responsive, accessible, analytics verified, owner seen on preview.
- **Change control:** anything not in the PRD becomes a written change request with estimate and launch-date impact.
