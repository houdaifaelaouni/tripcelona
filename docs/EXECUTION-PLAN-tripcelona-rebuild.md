# Tripcelona Rebuild — Execution Plan

| Field | Value |
|---|---|
| Document | Delivery / execution plan |
| Companion | `docs/PRD-tripcelona-rebuild.md` |
| Version | 0.1 |
| Date | 10 Nov 2026 |
| Assumption | 1 senior full-stack dev (full-time) + part-time design/content support + owner for approvals |
| Calendar | ~9 weeks from kickoff to launch + 1 week hypercare |

Estimates are dev-days (d) for one senior developer, including review and basic tests. Calendar assumes some parallel work between dev and content. With two devs, calendar compresses to ~6 weeks; costs scale accordingly.

---

## 1. Delivery strategy

1. **Content first, code second.** Export and normalise tours, departures, media and copy in week 1 so the schema is validated against real content, not samples.
2. **Vertical slices.** Each phase ships a working, reviewable slice on a Vercel preview (catalog → tour → checkout), not horizontal layers.
3. **Redirects are a first-class deliverable.** The old URL map is built and tested before any DNS change.
4. **Legacy site stays live only until cutover.** No downtime; rollback is a DNS switch.
5. **Zero WordPress in the deliverable.** No PHP runtime, no wp-admin, no plugins, no theme, no WooCommerce/Elementor code. WordPress is a one-time content source only; the legacy site is frozen at cutover and decommissioned at T+30.

---

## 2. Phase overview

| Phase | Focus | Dev-days | Calendar |
|---|---|---|---|
| 0 | Discovery, decisions, content export | 3 | Week 1 |
| 1 | Foundation: repo, CI, Supabase schema, envs | 4 | Week 1–2 |
| 2 | Design system + global shell (header/footer/hero) | 4 | Week 2 |
| 3 | Catalog + tour detail + SEO | 7 | Week 3–4 |
| 4 | Booking, availability, payments, emails | 8 | Week 4–5 |
| 5 | Admin/CMS | 6 | Week 6 |
| 6 | Content migration + i18n + legal | 5 | Week 6–7 |
| 7 | QA: e2e, performance, accessibility, SEO crawl | 5 | Week 7–8 |
| 8 | Launch + hypercare | 5 | Week 8–9 |
| — | Buffer (15%) | 7 | — |
| **Total** | | **~54 d** | **~9 weeks** |

---

## 3. Phase 0 — Discovery and decisions (3 d)

**Goal:** lock scope, collect content, close decisions D1–D10 from the PRD.

Tasks:

- [ ] 0.1 Kickoff call: confirm goals, success metrics, launch date, owner availability (0.5 d).
- [ ] 0.2 Close payment decision (Stripe vs PayTPV/Redsys); confirm merchant contract and settlement (0.5 d, owner).
- [ ] 0.3 Extract legacy content once: pages, posts, products, categories, media, menus, SEO meta (1 d). Alternative: skip the export and enter content directly in the new admin; the build does not depend on WordPress running.
- [ ] 0.4 Build the URL inventory from the live sitemap + Search Console top pages; store as `migration/urls.csv` (0.5 d).
- [ ] 0.5 Content gap list: missing tour fields (capacity, departures, inclusions, meeting point), legal entity data, branded email (0.5 d).
- [ ] 0.6 Confirm languages, events scope, reviews policy (0.5 d).

**Exit criteria:** signed-off scope, content export available, D1/D2/D3 closed, URL inventory complete.

---

## 4. Phase 1 — Foundation (4 d)

**Goal:** a deployable skeleton with the real data model and CI.

Tasks:

- [ ] 1.1 Create Next.js repo (TypeScript, App Router, Tailwind v4, ESLint/Prettier) (0.5 d).
- [ ] 1.2 Vercel project + preview/production envs; connect Git; protect preview URLs (0.5 d).
- [ ] 1.3 Supabase project (prod) + local dev via CLI; link, generate types (0.5 d).
- [ ] 1.4 Migrations for all tables in PRD §8 + RLS policies + `hold_seats` RPC + triggers (1.5 d).
- [ ] 1.5 Storage buckets and upload helpers (0.25 d).
- [ ] 1.6 Seed script: 5 tours, departures, FAQs, settings from exported content (0.5 d).
- [ ] 1.7 CI: typecheck, lint, unit tests, build on PR; Lighthouse job on preview (0.5 d).
- [ ] 1.8 `.env.example`, README setup/deploy runbook (0.25 d).

**Exit criteria:** `vercel preview` renders a page reading tours from Supabase; CI green; migrations reproducible from scratch.

---

## 5. Phase 2 — Design system and global shell (4 d)

Tasks:

- [ ] 2.1 Tokens (colors, spacing, radii, typography) + Tailwind theme from `booking.md` (0.5 d).
- [ ] 2.2 UI primitives: Button, Input, Select, Card, Badge, Accordion, Dialog, Tabs (1 d).
- [ ] 2.3 Header (desktop + mobile drawer, cart count, phone/WhatsApp) (1 d).
- [ ] 2.4 Footer (nav, legal, contact, schedule) (0.5 d).
- [ ] 2.5 Hero component with video/poster, overlay, H1, search widget (0.75 d).
- [ ] 2.6 Layout, 404, loading/error states, skip link (0.25 d).

**Exit criteria:** shell matches the design direction; keyboard navigation and focus states pass a manual audit; no layout shift from fonts/media.

---

## 6. Phase 3 — Catalog and tour detail (7 d)

Tasks:

- [ ] 3.1 Catalog page with server-side filters (area, month, duration, price) and URL state (1.5 d).
- [ ] 3.2 Tour card component with next departure and price-from (0.5 d).
- [ ] 3.3 Tour detail page: gallery, highlights, itinerary, inclusions, packing list, meeting point (2 d).
- [ ] 3.4 Departure picker + seats-left display, sold-out handling (1 d).
- [ ] 3.5 Related tours, per-tour FAQ (0.5 d).
- [ ] 3.6 Metadata, canonical, OG image generation, JSON-LD (Product/TouristTrip/FAQ/Breadcrumb) (1 d).
- [ ] 3.7 Sitemap + robots generation from DB (0.5 d).

**Exit criteria:** all 5 tours render from DB; filters shareable; rich results validate; Lighthouse ≥ 90 on mobile.

---

## 7. Phase 4 — Booking, availability, payments (8 d)

Tasks:

- [ ] 4.1 Checkout page: traveller details, validation, price recomputation server-side (1 d).
- [ ] 4.2 Seat hold flow (`hold_seats`), hold expiry job, release on failure (1 d).
- [ ] 4.3 Payment integration (Stripe Payment Element or Redsys redirect) (2 d).
- [ ] 4.4 Webhook handler: signature check, idempotency, booking status transition, payment row (1 d).
- [ ] 4.5 Confirmation page + booking reference + `.ics` calendar file (0.5 d).
- [ ] 4.6 Emails: customer confirmation, owner alert, failure/refund notices (1 d).
- [ ] 4.7 Cancellation/refund action in admin (0.75 d).
- [ ] 4.8 Concurrency test: 10 parallel checkouts on 1 seat; verify no oversell (0.75 d).

**Exit criteria:** live test transaction succeeds; webhook replay is idempotent; oversell test passes; emails delivered to inbox (not spam).

---

## 8. Phase 5 — Admin / CMS (6 d)

Tasks:

- [ ] 5.1 Auth + middleware + role checks (owner/editor) (0.75 d).
- [ ] 5.2 Admin layout, navigation, dashboard counts (0.5 d).
- [ ] 5.3 Tours CRUD + departures/capacity/price management + revalidation (1.5 d).
- [ ] 5.4 Bookings list/detail, manual booking, resend email, refund (1 d).
- [ ] 5.5 Blog/pages editor (Tiptap), cover, SEO fields, draft/publish + preview (1.25 d).
- [ ] 5.6 Media library with upload + alt text (0.5 d).
- [ ] 5.7 Quote requests inbox with statuses (0.5 d).
- [ ] 5.8 Settings (phone, WhatsApp, email, socials) (0.25 d).
- [ ] 5.9 Audit log for destructive actions (0.25 d).

**Exit criteria:** owner completes a scripted walkthrough (create departure, change price, publish post) without developer help.

---

## 9. Phase 6 — Content migration, i18n, legal (5 d)

Tasks:

- [ ] 6.1 Media pipeline: download originals, resize/convert, upload to Supabase Storage with stable paths (1 d).
- [ ] 6.2 Import tours, departures, FAQs, blog, pages into Supabase; sanitise rich text; fix internal links. One-time import — no WordPress runtime or plugin code in the new app (1.5 d).
- [ ] 6.3 Legal pages migrated; cookie policy updated for new processors (0.5 d).
- [ ] 6.4 Redirect map implemented in `next.config`/middleware + CI crawl assertion (1 d).
- [ ] 6.5 Spanish UI strings; EN scaffolding (no fake translations) (0.5 d).
- [ ] 6.6 Contact/quote forms wired to DB + email + WhatsApp deep links (0.5 d).

**Exit criteria:** preview content-complete; redirect crawl green; no placeholder copy.

---

## 10. Phase 7 — QA and hardening (5 d)

Tasks:

- [ ] 7.1 Playwright e2e: home → catalog → tour → checkout (test card) → confirmation (1 d).
- [ ] 7.2 Playwright: quote form, contact form, admin login + publish (0.75 d).
- [ ] 7.3 Cross-browser/device pass (iOS Safari, Android Chrome, desktop) (0.75 d).
- [ ] 7.4 Accessibility audit (axe + manual keyboard/screen-reader smoke) (0.75 d).
- [ ] 7.5 Performance: Lighthouse CI budget on 3 pages, fix regressions (0.75 d).
- [ ] 7.6 Security checklist: RLS tests, rate limits, CSP, webhook auth, secret scan (0.5 d).
- [ ] 7.7 SEO crawl: old URL list → status codes; metadata/schema spot-check (0.5 d).

**Exit criteria:** all critical paths pass; no P0/P1 defects open; budgets met or exceptions documented.

---

## 11. Phase 8 — Launch and hypercare (5 d)

Cutover runbook (T-1 day → T+7):

1. **T-2 d:** final content freeze; full backup of WP DB + uploads; export final URL list.
2. **T-1 d:** lower DNS TTL to 300 s; deploy production build; run smoke tests on the Vercel URL with `noindex` enabled.
3. **T-0 (low-traffic window):** remove `noindex`, switch DNS to Vercel, verify TLS, home/catalog/tour/checkout, emails, sitemap.
4. **T-0 + 1 h:** submit sitemap in Search Console; check 404s in Vercel logs; verify analytics/consent.
5. **T+1 d:** Search Console coverage check; fix any redirect misses; monitor error rate.
6. **T+7 d:** performance review (CrUX/Speed Insights), booking funnel review, close hypercare.

Launch checklist:

- [ ] DNS + TLS + www/non-www redirect
- [ ] All env vars set in production (no test keys)
- [ ] Stripe live mode + webhook endpoint verified
- [ ] SPF/DKIM/DMARC for sender domain
- [ ] Backups enabled + restore tested
- [ ] Uptime monitor on `/` and `/reservar`
- [ ] Error tracking receiving events
- [ ] Legal pages + consent banner live
- [ ] Sitemap submitted; robots correct
- [ ] 301 map verified on production
- [ ] Rollback plan rehearsed (DNS back to WP, TTL 300 s)
- [ ] Owner trained; admin credentials stored in password manager
- [ ] Legacy WordPress frozen and decommissioned at T+30; no WP files, plugins, themes or dependencies in the new repo

---

## 12. Work breakdown (ticket-level backlog)

| ID | Ticket | Est. | Depends on |
|---|---|---|---|
| T-001 | Repo, lint, TS config, Tailwind | 0.5 | — |
| T-002 | Vercel project + envs | 0.5 | T-001 |
| T-003 | Supabase project + CLI + types | 0.5 | — |
| T-004 | Schema migrations (tours, departures, bookings, payments, posts, pages, faqs, reviews, media, settings, requests, events) | 1.5 | T-003 |
| T-005 | RLS policies + role tests | 0.5 | T-004 |
| T-006 | `hold_seats` RPC + expiry job | 1 | T-004 |
| T-007 | Seed data script | 0.5 | T-004 |
| T-008 | CI pipeline + Lighthouse job | 0.5 | T-001 |
| T-009 | Design tokens + primitives | 1.5 | T-001 |
| T-010 | Header/footer/layout | 1.5 | T-009 |
| T-011 | Hero + search widget | 0.75 | T-009 |
| T-012 | Catalog + filters | 1.5 | T-004, T-009 |
| T-013 | Tour card | 0.5 | T-012 |
| T-014 | Tour detail sections | 2 | T-012 |
| T-015 | Departure picker | 1 | T-006, T-014 |
| T-016 | Metadata + JSON-LD + OG | 1 | T-014 |
| T-017 | Sitemap/robots | 0.5 | T-014 |
| T-018 | Checkout form + server validation | 1 | T-015 |
| T-019 | Payment integration | 2 | T-018 |
| T-020 | Webhook + idempotency | 1 | T-019 |
| T-021 | Confirmation page + ICS | 0.5 | T-020 |
| T-022 | Email templates + Resend | 1 | T-020 |
| T-023 | Refund/cancel flow | 0.75 | T-020 |
| T-024 | Concurrency test | 0.75 | T-006, T-018 |
| T-025 | Admin auth + roles | 0.75 | T-005 |
| T-026 | Tours/departures admin | 1.5 | T-025 |
| T-027 | Bookings admin | 1 | T-025 |
| T-028 | Blog/pages editor | 1.25 | T-025 |
| T-029 | Media library | 0.5 | T-025 |
| T-030 | Quote inbox | 0.5 | T-025 |
| T-031 | Settings + audit log | 0.5 | T-025 |
| T-032 | Media migration pipeline | 1 | T-004 |
| T-033 | Content import + sanitise | 1.5 | T-032 |
| T-034 | Legal pages | 0.5 | T-033 |
| T-035 | Redirect map + CI crawl | 1 | T-033 |
| T-036 | UI strings ES + EN scaffold | 0.5 | T-010 |
| T-037 | Forms wiring + rate limits | 0.5 | T-012 |
| T-038 | Playwright booking e2e | 1 | T-021 |
| T-039 | Playwright forms/admin e2e | 0.75 | T-030 |
| T-040 | Device/browser pass | 0.75 | T-038 |
| T-041 | Accessibility audit | 0.75 | T-040 |
| T-042 | Performance budget pass | 0.75 | T-040 |
| T-043 | Security checklist | 0.5 | T-025 |
| T-044 | SEO crawl | 0.5 | T-035 |
| T-045 | Launch runbook + rollback rehearsal | 1 | all |
| T-046 | Owner training + handover doc | 0.5 | T-045 |

Total ≈ 43 dev-days of tickets + 15% buffer + discovery/management ≈ 54 days.

---

## 13. Environments and release process

- **Branches:** `main` → production; short-lived feature branches → preview deploys.
- **Migrations:** every schema change is a reviewed SQL migration committed to `supabase/migrations`; applied to staging then production; no manual dashboard edits in prod.
- **Feature flags:** env-based for payments/EN; no long-lived branches.
- **Release cadence:** continuous after launch; content publishes directly from admin (no deploy needed).
- **Rollback:** Vercel instant rollback to previous deployment; DNS rollback to WP within TTL; DB migrations are additive/backward compatible for one release.

---

## 14. Testing strategy

| Layer | Scope | Tool |
|---|---|---|
| Unit | price calculation, date/format helpers, Zod schemas | Vitest |
| Integration | server actions with local Supabase, RLS policies | Vitest + Supabase local |
| E2E | booking, quote, contact, admin publish | Playwright |
| Visual | home, catalog, tour, checkout at 3 breakpoints | Playwright screenshots (manual review) |
| Performance | LCP/CLS/INP budgets | Lighthouse CI + Speed Insights |
| Accessibility | automated + manual keyboard | axe-core + manual |
| SEO | status codes, metadata, schema | crawl script + Rich Results test |
| Load | 10 concurrent checkouts on 1 seat | script/k6 |

---

## 15. Risks and mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Payment contract forces PayTPV/Redsys | +4–6 d, 3DS complexity | Medium | Close D1 in week 1; prototype redirect flow early |
| Content not ready (prices, departures) | Launch slip | High | Content freeze plan; seed with real data week 1; owner owns gaps |
| SEO loss from redirect misses | Traffic drop | Medium | URL inventory + CI crawl + Search Console monitoring |
| Supabase cold starts / limits | Slow admin | Low | Pro plan; indexes; cached public reads |
| Email deliverability | Bookings without confirmation | Medium | Domain auth (SPF/DKIM/DMARC), warm-up, Resend |
| Overselling seats | Customer harm | Medium | Atomic RPC + concurrency test + hold expiry |
| Scope creep (accounts, ticketing, i18n) | Delay | High | Non-goals list; change request per addition |
| Owner unavailable for approvals | Delay | Medium | Weekly 30-min review slot; async approvals |

---

## 16. Definition of done

A ticket is done when:

- Code merged with review, types and lint clean.
- Unit/integration tests where logic exists; e2e updated for user-facing flows.
- Works on preview at 360 px and 1440 px, keyboard accessible.
- No new console errors or failed network requests.
- Analytics event (if applicable) verified in debug view.
- Docs/env vars updated; no secrets committed.
- Product owner has seen it on preview (for user-facing work).

---

## 17. Post-launch backlog (first 90 days)

1. English locale with human translations.
2. Booking lookup by reference (no account).
3. Waitlist for sold-out departures.
4. Automated invoices (Stripe Invoicing or external).
5. Review collection flow post-trip.
6. Blog editorial calendar + newsletter capture.
7. A/B test of hero CTA and search widget defaults.
8. Event ticketing if volume justifies it.

---

## 18. Immediate next actions (this week)

1. Approve PRD scope and close decisions D1–D3.
2. Provide access: domain registrar, current hosting, Google Search Console, GA4, Stripe/PayTPV account.
3. Deliver content pack: tour details, departure calendar, prices, policies, legal entity data, brand assets, review quotes.
4. Confirm launch date and the weekly review slot.
5. Kick off Phase 0 export and URL inventory.
