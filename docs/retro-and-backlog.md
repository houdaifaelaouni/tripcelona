# Retrospective and 90-day backlog (Sprint 10, US-43)

**Status: proposal.** The Product Owner agrees the actions and the backlog
order at the Sprint 10 review. Nothing here is a business decision.

## Where the project stands

All ten sprints of build work are merged (PRs #1 to #9, plus this one). The
site is **not live yet**. What is left is owner input and the cutover:

- **Decisions:**
  - D2 languages, D3 events, D4 accounts, D5 invoicing, D6 reviews source.
  - D7 sender domain, D8 analytics and consent, D9 DNS, D10 WordPress retention.
- **Content:**
  - Cookie policy text, privacy policy update and legal identity.
  - `/grupos`, the hero video and poster, the SVG logo.
  - Real capacities and dates, plus 2 FAQ corrections.
- **Accounts:**
  - Vercel and Supabase production projects.
  - Live Redsys credentials.
  - Resend domain.
- The launch runbook, the go/no-go checklist, then 7 days of hypercare.

Sprint 10's acceptance (7 days of monitoring, the owner working unaided) can
only be met after launch. The tooling for it is ready: the health report, the
operations runbook, the owner guide with exercises and the hypercare log.

## Retrospective

**Keep**

- **Tests on every risky path, run in CI on every PR:**
  - Database tests for seat holds, RLS and payment idempotency.
  - The fake Redsys gateway, so end-to-end tests cover a full card payment.
  - The URL crawl against `migration/urls.csv`.
- **Migrations and seed as the only source of the schema.** A fresh database
  is one command away.
- **TODO markers instead of invented facts** (prices, legal text,
  capacities). Every gap is listed in `docs/launch/go-no-go.md`.

**Stop**

- **Building ahead of the inputs that block launch.** Code is done, but the
  same owner items have been open since Sprint 1: D2/D3, the content pack and
  access.
- **Relying on screenshots for content checks.** The WordPress export was far
  better than paraphrased page fetches. Ask for exports and access first.

**Start**

- **A weekly 30-minute decision slot with the Product Owner**, until every
  P0/P1 in `go-no-go.md` is closed.

**Velocity**

Planned: 15–20 points per sprint, 124 points across 43 stories in total.
The build was agent-assisted, so points per sprint say little here. The engineering stories are done. The
stories that depend on the owner or on production are not: US-01, US-02 and
US-04 are partly done; US-40 needs the live cutover; US-41 and US-42 need
launch week. Points are not the constraint now. Owner inputs are, so no
re-forecast is proposed. What is proposed is to fix a launch date once D9
access exists.

**Action**

| Action | Owner | Due |
| --- | --- | --- |
| Close D3 (events) and D7/D9, and send the cookie policy text, so go-no-go P1s are cleared | Product Owner | `<date>` |
| Create the Vercel and Supabase production projects and run the runbook from T-7 | Developer, with owner access | `<date>` |

## 90-day backlog (proposed order)

Each item has a short reason. The order is a proposal; the PO decides.

| # | Item | Why now | Size | Depends on |
| --- | --- | --- | --- | --- |
| 1 | **Booking lookup by reference** (email + reference, no account) | Cuts "did my booking go through?" messages. Data and emails already exist. | 3 | — |
| 2 | **Waitlist for sold-out departures** | Captures demand on full dates. The owner can add a departure when there is interest. | 3 | — |
| 3 | **Post-trip review collection** (email after the trip, owner approves) | Real reviews for tour pages and JSON-LD. A `reviews` table already exists. | 3 | D6 |
| 4 | **Analytics with consent** (GTM/GA4 or a cookieless option, plus a banner) | Measure the funnel beyond the health report. | 3 | D8, cookie policy |
| 5 | **English locale** with human translations | International visitors in Barcelona. | 8 | D2, translations |
| 6 | **Invoices** for paid bookings | Needed by groups and companies. | 5 | D5 |
| 7 | **Newsletter capture** and a blog editorial calendar | Repeat bookings. `leads` already stores newsletter opt-ins. | 2 | D8 |
| 8 | **A/B test** of the hero call to action and search defaults | Only worth it with enough traffic (after #4). | 3 | #4 |
| 9 | **Event ticketing** | Only if D3 says events are in scope. | 8 | D3 |
| 10 | **Speed Insights** (Core Web Vitals from real visitors) | Replaces manual Lighthouse runs. | 1 | — |

Also carry over:

- Sentry, or another error tracker (`SENTRY_DSN` is in `.env.example` but not wired).
- The P1/P2 issues found during hypercare.
