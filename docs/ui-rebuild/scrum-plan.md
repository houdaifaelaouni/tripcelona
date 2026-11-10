# UI rebuild: scrum plan

Rebuild the Tripcelona interface with components from **Opensource UI**
(https://opensourceui.in, MIT, repo `bidyut10/opensourceui`) and the layout,
type, shape and elevation rules of the supplied `airbnb.design.md`.

**Colours are out of scope.** The design file's colour section is not used.
Tripcelona keeps its own palette (navy, yellow, blue, ink, muted, borders,
danger, success, WhatsApp green), its contrast-checked pairs and its yellow
focus ring. Wherever the design file says "primary" or "Rausch", we use the
existing Tripcelona role for that job (`blue` for actions, `navy` for brand
surfaces, `yellow` for highlights and focus).

## Ground rules

1. **No behaviour change.** Same routes, same data, same server actions,
   same SEO output. Every sprint keeps the 21 e2e tests, axe checks and
   Lighthouse budgets green (performance ≥ 90 on home and tour, CLS ≤ 0.1,
   JS ≤ 200 KB gzip per route).
2. **Copy, adapt, credit.** Opensource UI is copy-paste, not a package.
   Each adopted file goes to `src/components/ui/` (or the feature folder),
   keeps a header `Adapted from Opensource UI (MIT, © 2026 Bidyut Kundu)`,
   and is listed in `THIRD_PARTY_NOTICES.md`. Hard-coded `neutral-*`,
   `emerald-*` and arbitrary hex values are replaced by our tokens.
3. **Only what we need.** No mockups, docks, social posts or decorative
   backgrounds. Every adopted component replaces something that exists or
   serves an existing feature.
4. **Brand-neutral.** We take the design file's rules (soft radii, modest
   type weights, one shadow tier, photo-first cards, pill search) but no
   Airbnb name, wordmark, illustrations, icons or the licensed Cereal font.
   Type stays **Inter** (already self-hosted via `next/font`).
5. **Spanish copy unchanged**, no new business facts (prices, policies,
   reviews). Things the owner must supply stay as TODO.
6. **Accessibility first.** Every adopted component is checked for keyboard,
   focus, labels and contrast; Opensource UI widgets that are not accessible
   are fixed in the copy (or not adopted).
7. One sprint = one PR = one Vercel preview to review.

## Design tokens taken from the design file (no colours)

| Area | Today | Target |
| --- | --- | --- |
| Base text | 14px | 16px body (`body-md`), 14px meta (`body-sm`) |
| Headings | 700 everywhere | display 28/700, 22/500, 21/700, 20/600; titles 16/600 |
| Radii | 4 / 8 / 12 | 8 controls, 14 cards, 20 large panels, 32 pills-on-strips, full for search/orbs/chips |
| Spacing | ad hoc | 4px base: 2 4 8 12 16 24 32 48 64; sections 64px |
| Elevation | 2 shadows | one tier: `0 0 0 1px rgb(0 0 0/.02), 0 2px 6px rgb(0 0 0/.04), 0 4px 8px rgb(0 0 0/.1)` |
| Container | 1140px | 1280px marketing, 1080px tour detail |
| Controls | 40px | 48px buttons, 56px text inputs, 48px search orb |
| Breakpoints | Tailwind default | 744 / 1128 / 1440 |

## Component map (Opensource UI → Tripcelona)

| Opensource UI | Used for |
| --- | --- |
| `soft-pill-button`, `segmented-toggle-button` | Button variants, catalog view/sort toggles |
| `quantity-stepper-button` | Travellers count (booking widget, quote wizard) |
| `text-field-input`, `textarea-field-input`, `floating-label-field-input` | All public and admin forms |
| `select-field-input`, `combobox-field-input` | Area filter, tour select in quote form |
| `date-field-input`, `booking-slot-calendar`, `week-strip-calendar` | Departure picker, date filters |
| `phone-field-input`, `checkbox-field-input`, `radio-group-field-input`, `switch-field-input` | Checkout, consent, settings |
| `search-input` | Header and admin search |
| `password-field-input`, `login-form` | Admin login |
| `contact-form`, `newsletter-form` | Contact page, footer newsletter (only if D8 allows) |
| `filter-sort-dropdown`, `user-menu-dropdown`, `kebab-actions-dropdown` | Catalog sort, admin account menu, row actions |
| `toast-notification-banner`, `system-alert-banner` | Form results, admin flash, site banner |
| `gallery-grid-card` | Tour photo gallery |
| `orders-table`, `customers-table` | Admin bookings and requests |
| `spin-loader`, `text-loader` | Pending states |
| `testimonial-card` | Reviews, **only** once D6 provides real reviews |

## Sprints

Points use the same scale as the build plan (1, 2, 3, 5, 8).

### UI-1 Foundations (13 pts)
- UI-1.1 Tokens: radius, spacing, type scale, single shadow, container and
  breakpoints in `globals.css`; base text 16px. (3)
- UI-1.2 `cn()` with `clsx` + `tailwind-merge`; `lucide-react` icons
  replace hand-written SVGs where 1:1. (2)
- UI-1.3 Primitives rebuilt from Opensource UI: Button (primary, secondary,
  tertiary, pill, WhatsApp), IconButton (circle, outline), Badge/Tag, Field
  family (text, textarea, select, checkbox, radio, switch, phone), Quantity
  stepper, Segmented toggle, Spinner. Old exports stay as thin wrappers so
  pages keep working. (5)
- UI-1.4 `/__ui__` component gallery page (noindex, dev and preview only)
  and `THIRD_PARTY_NOTICES.md`. (2)
- UI-1.5 Visual baseline: Playwright screenshots of home, catalog, tour,
  checkout, contact, admin at 375 and 1280 widths. (1)

**Done when** primitives render in the gallery, axe is clean on it, and all
existing tests pass with no page-level changes yet.

### UI-2 Header, footer, search (13 pts)
- 80px header with logo left, nav centre, actions right; mobile sheet
  below 744px. (5)
- Pill search bar: segments **Zona · Fecha · Personas** split by hairlines,
  circular search orb; collapses to one tappable pill on mobile that opens a
  full-screen sheet. Same query params as today. (5)
- Light footer, three link columns, legal band. (3)

### UI-3 Catalog and tour cards (13 pts)
- Photo-first tour card: square photo clipped at 14px, image carousel with
  dots, badge top-left (e.g. "Últimas plazas" only when data says so),
  title 16/600, meta 14px muted, price right. (5)
- Category strip for areas (scrollable chips) and sort dropdown. (3)
- Grid 1/2/3/4 columns at the new breakpoints, 16px gutters; empty state
  and skeletons rebuilt. (3)
- Home sections re-laid on the 64px section rhythm. (2)

### UI-4 Tour detail (13 pts)
- Two-column layout (≈64/32) at 1080px max, sticky reservation card on the
  right; sticky bottom bar with price + "Reservar" on mobile. (5)
- Gallery grid with full-screen viewer. (3)
- Departure picker as calendar/slot list with circular day cells. (3)
- Itinerary, inclusions and FAQ as list rows with hairline section
  dividers. (2)

### UI-5 Booking and forms (13 pts)
- Checkout: 56px inputs, stepper for travellers, summary card. (5)
- Quote wizard with step indicator and the same validation. (5)
- Contact form, confirmation and pending pages, toasts. (3)

### UI-6 Content pages (8 pts)
- Blog index cards and article typography. (3)
- FAQ page, legal pages, 404 and error pages. (3)
- Rich-text styles on the new type scale. (2)

### UI-7 Admin (13 pts)
- Login with password field and MFA step. (2)
- Shell: side nav, user menu dropdown, page headers. (3)
- Tables for bookings, requests, tours, posts with row actions. (5)
- Editor forms, settings and team pages on the new fields; flash → toast. (3)

### UI-8 Hardening and handover (8 pts)
- Full axe sweep, keyboard pass, 200% zoom pass. (3)
- Lighthouse on home, catalog, tour, checkout; fix regressions. (2)
- Visual comparison against the UI-1 baseline; remove the old wrappers
  and dead CSS. (2)
- Update `docs/owner-guide.md` screenshots and README. (1)

**Total: 94 points, 8 sprints.**

## Risks

| Risk | Mitigation |
| --- | --- |
| Opensource UI widgets are styled for demos, hard-coded colours | Re-token every copied file; review in the gallery before use |
| Some widgets lack ARIA or keyboard support | Fix in our copy or keep our accessible version |
| Bigger base font and controls push content down (CLS, LCP) | Lighthouse and screenshot checks every sprint |
| Copying a well-known brand look too closely | Rules only, our colours, our logo, Inter, no copied assets |
| Booking flow regressions | e2e booking suite is the gate for UI-4 and UI-5 |
