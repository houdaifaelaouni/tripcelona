# Go / no-go checklist (Sprint 9)

Signed by the Product Owner before the cutover in `runbook.md`. **Go** needs
every P0 and P1 line ticked or explicitly accepted below.

Status as of 2026-11-10 (end of Sprint 9 build work).

## Verified in the repository (CI runs these on every PR)

- [x] Every URL in `migration/urls.csv` answers 200 or a single 301 to a page
      that answers 200, except the 3 `pending` rows below (`pnpm check:urls`).
- [x] WordPress-only endpoints (`/wp-admin`, `/wp-login.php`, `/xmlrpc.php`,
      `/feed`) answer 410. Unknown pages answer a real 404, not a 200.
- [x] E2E: home → catalog → tour → checkout → declined card → paid card →
      confirmation and calendar file; quote wizard; contact form; owner login
      and publish a post (`pnpm e2e`, against the fake Redsys gateway).
- [x] Accessibility: axe finds no critical or serious issue on 9 key pages;
      skip link and booking picker work by keyboard.
- [x] No horizontal scroll at 360, 768 and 1440 px on key pages.
- [x] Security headers: CSP, HSTS (production), X-Frame-Options, Referrer and
      Permissions policy. No CSP violations while booking or using the admin.
- [x] Redsys notification signature checks, forms rate limit and RLS have
      unit and database tests. Secret scan runs in CI (gitleaks).
- [x] Lighthouse mobile (local build): home 99, catalog 95–99, tour 92–96,
      blog 96–97; CLS 0; JS 156–194 KB gzip.

## Still to verify on the real deployment (runbook)

- [ ] **P0** Live card payment, confirmation email and refund on
      `https://tripcelona.com` (needs live Redsys credentials).
- [ ] **P0** `pnpm check:urls --strict-pending` on production with the
      imported content: 0 failures.
- [ ] **P0** Backups or point-in-time recovery enabled, one restore tested.
- [ ] **P1** Lighthouse mobile ≥ 90 and LCP ≤ 2.5 s on the Vercel preview with
      real images. The local run could not load images (the legacy image host
      is blocked from the build machine), so LCP there is only indicative.
- [ ] **P1** Real devices: iOS Safari and Android Chrome. Only Chromium (desktop
      and Pixel 7 emulation) was available for automated runs.
- [ ] **P1** Screen-reader smoke test (VoiceOver on iOS or NVDA): book a tour
      and send the quote form.
- [ ] **P1** Sender domain verified with SPF, DKIM, DMARC (D7).
- [ ] **P2** Uptime monitor on `/health`, `/`, `/reservar`.

## Owner decisions and content still open

| Priority | Item | Why it blocks |
| --- | --- | --- |
| P1 | Cookie policy text | `/politica-de-cookies` is a 404 and the footer links to it. Legal requirement. |
| P1 | Privacy policy update (Stripe, Hostinger) and legal identity in Ajustes | Legal pages show "(pendiente)" and name providers that are not used. |
| P1 | **D3 events**: the header links to "Agenda de eventos" (`/eventos`), which has no page yet | Every page links to a 404. Decide the events scope, or remove the link until then. |
| P1 | **D9 DNS**: registrar access and who changes the records | Cutover cannot happen without it. |
| P1 | **D7 email sender domain** | Booking and form emails need a verified sender. |
| P2 | `/grupos` content or a redirect target | Old indexed URL, now 404. |
| P2 | **D8 analytics and consent** | No analytics at launch unless decided; adding it later needs a consent banner and CSP update. |
| P2 | **D10** what happens to WordPress after T+7 | Rollback window. |
| P2 | D2 languages, D4 accounts, D5 invoicing, D6 reviews source | Not needed for a Spanish-only guest-checkout launch. |
| P2 | Personal Gmail in 2 FAQs; FAQ meeting point (Plaza España vs Estació del Nord) | Visible content errors. |
| P2 | Hero video and poster, SVG logo, real capacities, Aigüestortes dates | Owed since Sprint 1. |

## Sign-off

- Product Owner: ______________________  Date: ____________  Go / No-go
