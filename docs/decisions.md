# Tripcelona rebuild — Decision log

Decisions from PRD §14. Sprint 1 (US-01) closes D1–D3; D4–D10 are tracked here so they are not lost, and must be closed by the sprint that needs them.

**Rule:** the build agent never closes a decision. Only the Product Owner (Ayoub) does, by stating the chosen option. Until then a decision stays **OPEN** with the options and the recommendation copied from the PRD.

| # | Decision | Status | Chosen option | Owner | Date closed | Needed by |
|---|---|---|---|---|---|---|
| D1 | Payment provider | **CLOSED** | B. Keep PayTPV / Redsys | HOUDAIFA (for the owner) | 2026-11-10 | Build in S6 |
| D2 | Languages at launch | **OPEN** | — | Ayoub | — | Gate G1 (end of S1) |
| D3 | Events scope / ticketing | **OPEN** | — | Ayoub | — | Gate G1 (end of S1) |
| D4 | Customer accounts | OPEN | — | Ayoub | — | S5 (checkout) |
| D5 | Invoicing | OPEN | — | Ayoub | — | S6 (payments) |
| D6 | Reviews source | OPEN | — | Ayoub | — | S4 (tour page) |
| D7 | Email sender domain | OPEN | — | Ayoub | — | S6 (emails) |
| D8 | Analytics / consent | OPEN | — | Ayoub | — | S8 (legal/consent) |
| D9 | Domain / DNS | OPEN | — | Ayoub | — | S9 (cutover) |
| D10 | Legacy WP retention | OPEN | — | Ayoub | — | S9 (cutover) |

---

## D1 — Payment provider

**Status:** CLOSED on 2026-11-10: **B. Keep PayTPV / Redsys**

**Question:** which provider takes card payments in the new checkout?

| Option | Notes |
|---|---|
| A. Stripe (Payment Element or Checkout) | Native Next.js integration, webhooks as source of truth, 3DS handled, built-in refunds. Requires a Stripe account for the business. |
| B. PayTPV / Redsys (current WooCommerce gateway) | Keeps the current merchant contract. Redsys HMAC + 3DS redirect flow; PRD §9.1 estimates +4–6 dev-days. |

**Recommendation (PRD):** Stripe, unless the current merchant contract forbids it. Confirm fees and settlement before choosing.

**Information needed from the owner:** does the PayTPV/Redsys contract have a minimum term, exclusivity or exit fee? Is there an existing Stripe account?

**If still OPEN at Sprint 6:** per SCRUM-PLAN §7, build the Stripe path and document the Redsys delta.

**Decision:** B. Keep PayTPV / Redsys (current merchant contract). Chosen by HOUDAIFA on 2026-11-10.

**Consequences:**
- Sprint 6 (US-19, US-20, US-22) builds the Redsys HMAC-SHA256 redirect flow with 3DS, with the Redsys notification URL as the source of truth instead of a Stripe webhook.
- PRD §9.1 estimates +4–6 dev-days; Sprint 6 must be re-sized at Sprint 5 refinement.
- Refunds go through the Redsys refund operation (transaction type 3) or the bank's portal; confirm the contract allows API refunds.
- Env vars change from Stripe to Redsys (see `.env.example`).
- Still needed from the owner before S6: merchant code (FUC), terminal, test environment access and the secret key, delivered through Vercel env vars, never in the repo.

---

## D2 — Languages at launch

**Status:** OPEN

| Option | Notes |
|---|---|
| A. Spanish only at launch | Root URLs in `es`. English follows as phase 1B (`/en/...`, `next-intl`, hreflang). |
| B. Spanish + English at launch | Needs owner-reviewed English copy for all five tours, legal pages and UI before launch. No machine translation in production (PRD §11). |

**Recommendation (PRD):** ES at launch, EN within 6 weeks.

**Decision:** _pending_

---

## D3 — Events scope / ticketing

**Status:** OPEN

| Option | Notes |
|---|---|
| A. Listing + external CTA | `/eventos` agenda and detail pages; CTA goes to booking, WhatsApp or an external registration link. |
| B. Built-in ticketing / seating (FooEvents-like) | Tickets, seating and check-in in the new system. Not estimated in the current plan; adds scope. |

**Recommendation (PRD):** listing + CTA at launch; ticketing only if volume justifies it.

**Information needed from the owner:** how many events used FooEvents ticketing in the last 12 months?

**Decision:** _pending_

---

## D4–D10 (tracked, not due in Sprint 1)

| # | Options | PRD recommendation |
|---|---|---|
| D4 Customer accounts | Guest only / magic-link accounts | Guest only at launch |
| D5 Invoicing | Manual / Stripe Invoicing / external | Manual at launch; automate later |
| D6 Reviews source | Google / TripAdvisor / manual | Manual entries with attribution; no scraping |
| D7 Email sender domain | `tripcelona.com` | Set up SPF/DKIM/DMARC before launch |
| D8 Analytics/consent | GTM + GA4 + custom banner / CMP vendor | Keep GTM+GA4 with a lightweight consent banner |
| D9 Domain/DNS | Keep registrar, point to Vercel | Lower TTL 24 h before cutover |
| D10 Legacy WP retention | Retire / keep read-only 30 days | Keep at `old.tripcelona.com` 30 days |

---

## Change history

| Date | Change | By |
|---|---|---|
| 2026-11-10 | Log created; D1–D10 recorded as OPEN | Build agent |
| 2026-11-10 | D1 closed: PayTPV / Redsys | HOUDAIFA |
