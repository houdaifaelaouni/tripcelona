# Tripcelona — Rebuild PRD (Code-Native, Vercel + Supabase)

| Field | Value |
|---|---|
| Document | Product Requirements Document |
| Product | tripcelona.com — group day trips across Catalonia from Barcelona |
| Version | 0.1 (draft for review) |
| Date | 10 Nov 2026 |
| Owner | Ayoub (Tripcelona) |
| Status | Draft — decisions in §14 must be closed before build starts |
| Related | `docs/EXECUTION-PLAN-tripcelona-rebuild.md`, `booking.md` (design direction) |

---

## 1. Executive summary

Tripcelona sells guided group day trips from Barcelona (Sunday departures from Estació del Nord). The current site is WordPress + Hello Elementor + Elementor Pro, with WooCommerce for bookings, The Events Calendar/FooEvents for the agenda, Rank Math for SEO, LiteSpeed + a CDN in front, GTranslate for languages, and Complianz for consent.

The site works, but it is slow to change, fragile (theme edits are wiped by updates, cached CSS goes stale), and the rendering stack is heavy for a catalog of five tours. This PRD specifies a code-native rebuild on **Next.js (App Router) on Vercel** with **Supabase** for Postgres, auth, storage and file hosting, keeping the Booking.com-inspired visual direction already applied to the hero.

The rebuild is content- and SEO-preserving: every existing URL either maps 1:1 or 301s, all copy and imagery migrate, and booking, quote requests, events and the blog keep working on day one.

**No WordPress in the new stack.** WordPress is treated strictly as a one-time content source. The deployed product contains no PHP runtime, no wp-admin, no plugins, no theme and no WooCommerce/Elementor code. Once content is extracted and the redirects are verified, the WordPress site is frozen and decommissioned — it is not part of the architecture, the repo or the hosting.

---

## 2. Problem and opportunity

### 2.1 Problems today

1. **Editing is slow and unsafe.** CSS/PHP changes live in the Hello Elementor theme and are lost on theme update; the CDN serves stale asset versions for days.
2. **Heavy front end.** Elementor + WooCommerce + events + consent + analytics ship far more CSS/JS than a five-tour catalog needs. Core Web Vitals suffer, especially on mobile over 4G.
3. **Booking UX is generic WooCommerce.** Cart → checkout is a shop flow, not a travel flow (date, travellers, pickup point, language).
4. **Content model is locked in page builders.** Tours, departures, prices and availability are not structured data, so filters, search and structured SEO are hard.
5. **Operational risk.** No staging discipline, 17 pending plugin updates, no automated backups visible, PHP admin surface exposed.
6. **Brand inconsistency.** The current header/footer and typography do not follow the Booking.com-style system now used in the hero.

### 2.2 Opportunity

A code-native build gives: sub-2s LCP on mobile, a real booking funnel, structured tour data (dates, capacity, price, inclusions), a small admin for the owner, clean SEO with schema and hreflang, and a codebase that can be changed safely and deployed in minutes.

---

## 3. Goals, non-goals and success metrics

### 3.1 Goals (v1)

- G1. Rebuild the public site in Next.js on Vercel with Supabase as the data layer.
- G2. Preserve SEO: every indexed URL resolves (200 or 301), metadata and schema parity or better.
- G3. Ship an end-to-end booking flow with real payments and confirmation emails.
- G4. Give the owner a small admin to manage tours, departures, bookings, blog posts, FAQs and quote requests without touching code.
- G5. Meet performance and accessibility budgets on mobile.
- G6. Make content and design changes deployable via Git with preview URLs.

### 3.2 Non-goals (v1)

- Native mobile apps.
- Multi-vendor marketplace or affiliate system.
- Loyalty/referral program.
- Real-time chat (WhatsApp remains the chat channel).
- Full ERP/accounting integration (invoices may be manual at launch).
- Rebuilding every legacy blog post's layout by hand (content migrates as structured rich text).
- **Any WordPress, PHP, Elementor, WooCommerce or plugin code in the new product.** The legacy site is a content source only and is retired after launch.

### 3.3 Success metrics

| Metric | Target | How measured |
|---|---|---|
| Mobile LCP (home, tour page) | ≤ 2.5 s at p75 | Vercel Speed Insights / CrUX |
| INP / CLS | ≤ 200 ms / ≤ 0.1 | CrUX |
| Lighthouse mobile performance | ≥ 90 on home + tour | CI Lighthouse run |
| Booking funnel completion | +20% vs current baseline | Analytics funnel |
| Quote requests (Crea tu tour) | +15% vs baseline | Form submissions |
| Organic sessions 30 days post-launch | ≥ 95% of pre-launch | GA4 / Search Console |
| Indexed URL 404s after launch | 0 in top 200 URLs | Screaming Frog crawl |
| Uptime | ≥ 99.9% monthly | Vercel status + checks |
| Time to publish a price/content change | < 10 min, no code | Admin walkthrough |

Baselines for conversion must be exported from GA4/WooCommerce before cutover; if unavailable, launch compares week-over-week traffic and bookings.

---

## 4. Users and personas

1. **Solo/couple traveller (primary).** Lives in or visits Barcelona, wants a one-day escape on Sunday, compares destinations and price, books on mobile, pays by card, expects instant confirmation and a WhatsApp channel.
2. **Group organiser / corporate (secondary).** Wants a private tour for 8–40 people, requests a quote via "Crea tu tour" or WhatsApp, cares about customisation, invoice and reliability.
3. **Event attendee.** Finds a dated event on the agenda, needs date, place, price and tickets/registration.
4. **Owner/operator (admin).** Manages 5 tours, weekly departures, capacity, prices, bookings, content and translations; not a developer.
5. **Content editor (part-time).** Writes blog posts and updates FAQs/legal pages.

---

## 5. Legacy audit — WordPress content source only (not reused)

### 5.1 Stack observed on the live site

> Nothing in this table ships in the new stack. It exists only to plan the one-time content extraction and the redirect map.

| Layer | Current |
|---|---|
| CMS | WordPress, Hello Elementor theme, Elementor Pro 4.3.x |
| Commerce | WooCommerce 11.x, PayTPV gateway, cart/checkout |
| Events | The Events Calendar 6.x + FooEvents (ticketing/seating) |
| SEO | Rank Math 1.0.x |
| Cache/CDN | LiteSpeed Cache + Hostinger `hcdn` |
| i18n | GTranslate (ES default, language switcher) |
| Consent | Complianz GDPR |
| Analytics | Google Tag Manager (`GT-K4ZB7QSZ`), Site Kit |
| Forms | Elementor Pro forms (contact/newsletter) |
| Hosting | Hostinger shared, PHP admin exposed |

### 5.2 Page inventory (public)

- `/` — home
- `/ofertas-de-viajes/` — tour catalog
- `/product/<slug>/` — 5 tour detail pages (WooCommerce products)
- `/crea-tu-tour/` — custom/private tour request
- `/eventos/` — events agenda
- `/sobre-nosotros/` — about
- `/blogs/` — blog index
- `/blog/<slug>/` — articles
- `/preguntas-frecuentes/` — FAQ
- `/contactanos/` — contact
- `/politica-de-privacidad/`, `/politica-de-devoluciones/`, `/condiciones-de-contratacion/`, `/politica-de-cookies/`, `/aviso-legal/`
- WooCommerce: `/cart/`, `/checkout/`, `/my-account/` (guest checkout in use)
- Search widget on home: tabs **Excursiones** / **Grupos Y Empresas**, destination select, "Salida en domingo desde Estació del Nord, Barcelona", CTA "Ver excursión".

### 5.3 Tours currently sold

| # | Title (current copy) | Area |
|---|---|---|
| 1 | La Ruta del Fuego: Fageda d'en Jordà y Castellfollit de la Roca | La Garrotxa |
| 2 | La Magia Rural de Cataluña: Rupit y Tavertet | Osona |
| 3 | El Reto del Pirineo: Queralbs y el Vall de Núria | Ripollès |
| 4 | El Cañón del Vero: Alquézar y la Ruta de las Pasarelas | Huesca (Aragón) |
| 5 | El Corazón Salvaje del Pirineo: Aigüestortes y Sant Maurici | Pallars |

### 5.4 Homepage sections (to be preserved or intentionally replaced)

1. Hero (video, H1, subcopy, search widget) — already redesigned.
2. "Próximas salidas" — 5 tour cards.
3. "Por qué ir de excursión con Tripcelona" — 4 value props.
4. "La Ruta de Exploración Definitiva" — experience/process block.
5. "Momentos Tripcelona" — photo gallery.
6. "Lo que dicen los grupos que viajan con Tripcelona" — testimonials.
7. Final CTA — "Descubre rincones únicos de Cataluña con guías expertos".
8. Footer — nav, legal, contact, WhatsApp.

### 5.5 Known content/ops issues to fix during migration

- Contact email published on the site is a personal Gmail address; move to a branded domain address.
- The hero video (`tripcelona-hero-pirineo.mp4`) must be re-encoded/compressed and served with a poster.
- Tour prices/dates are not consistently structured; the new model requires departure-level data.
- Some imagery is oversized (800–1000 px originals used at card sizes).

---

## 6. Information architecture and routing

Spanish is the default locale at the root. English is phase 1B (see §11). Routes are Spanish-first, matching current URLs where practical to minimise redirects.

| Current URL | New route | Notes |
|---|---|---|
| `/` | `/` | Home |
| `/ofertas-de-viajes/` | `/ofertas-de-viajes` | Catalog with filters |
| `/product/<slug>/` | `/excursiones/<slug>` | 301 from old product URLs |
| `/crea-tu-tour/` | `/crea-tu-tour` | Quote request |
| `/eventos/` | `/eventos` | Agenda; `/eventos/<slug>` detail |
| `/sobre-nosotros/` | `/sobre-nosotros` | |
| `/blogs/` | `/blog` | 301 |
| `/blog/<slug>/` | `/blog/<slug>` | 301 only if path changed |
| `/preguntas-frecuentes/` | `/preguntas-frecuentes` | FAQ + FAQPage schema |
| `/contactanos/` | `/contactanos` | Form + WhatsApp |
| `/cart/`, `/checkout/` | `/reservar` (single flow) | 301 cart/checkout |
| `/my-account/` | `/cuenta` (optional, v1.1) | Guest checkout at launch |
| Legal pages | same paths | 1:1 |

Rules:

- All redirects are permanent (308/301) and listed in a versioned `redirects.ts` map, tested in CI.
- Trailing-slash policy: no trailing slash, lowercase, hyphens.
- Unknown URLs return a designed 404 with search + top tours.

---

## 7. Functional requirements

Priorities: **M** = must have for launch, **S** = should, **C** = could (post-launch).

### 7.1 Home and global shell

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-01 | Full-bleed hero with background video, poster and gradient overlay | M | Video autoplays muted/loop/playsinline; poster shown before load; `prefers-reduced-motion` shows poster only; no layout shift |
| FR-02 | Hero search widget with tabs, destination select, date/group size and CTA | M | Submitting navigates to catalog with query params applied; keyboard accessible; works without JS for the basic select+submit |
| FR-03 | Sticky header with logo, primary nav, cart indicator, phone/WhatsApp | M | Nav matches current labels; mobile drawer; skip link; focus states |
| FR-04 | Footer with nav, legal links, contact, schedule | M | All links resolve; legal pages present |
| FR-05 | Global language switcher | S | ES active at launch; EN available when translations exist (no machine-translated copy) |

### 7.2 Catalog (`/ofertas-de-viajes`)

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-10 | Grid of tour cards with image, title, area, duration, price-from, next departure | M | Data comes from DB; cards link to detail |
| FR-11 | Filters: destination/area, month, duration, price range, "grupos" | M | Filters are URL state (shareable, back-button safe), applied server-side |
| FR-12 | Sort: next departure, price | S | Default = next departure |
| FR-13 | Empty state with WhatsApp CTA | M | Shown when filters return nothing |
| FR-14 | Pagination or "load more" | C | Only if catalog grows beyond 12 tours |

### 7.3 Tour detail (`/excursiones/[slug]`)

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-20 | Gallery (images + optional video), title, area, duration, difficulty, price | M | Optimised images, alt text, no CLS |
| FR-21 | Highlights, full itinerary (timeline), inclusions/exclusions, what to bring | M | Structured fields editable in admin |
| FR-22 | Meeting point with map link and departure time | M | Estació del Nord reference; Google Maps link |
| FR-23 | Departure picker (date, seats left, price) | M | Only bookable departures shown; sold-out disabled with label |
| FR-24 | Booking CTA → checkout with selected departure | M | Selection persists through the flow |
| FR-25 | Reviews/testimonials module | S | Real, attributable reviews only; no invented ratings |
| FR-26 | FAQ block per tour | S | Accordion, FAQPage schema |
| FR-27 | Related tours | S | Same area or next departure |
| FR-28 | Product/TouristTrip schema + canonical + OG image | M | Validated in Rich Results test |

### 7.4 Booking and payments

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-30 | Guest checkout: name, email, phone, travellers, pickup note, terms acceptance | M | Zod-validated; server-side price recomputation; no client-trusted totals |
| FR-31 | Seat hold and capacity enforcement | M | Atomic decrement; overselling impossible under concurrent requests; hold expires (e.g., 15 min) |
| FR-32 | Card payment | M | Stripe Payment Element (recommended) or PayTPV/Redsys if merchant contract requires; 3DS handled; webhook is source of truth |
| FR-33 | Confirmation page + email with booking reference, date, meeting point, what to bring | M | Email sent idempotently; resend available in admin |
| FR-34 | Admin notification on new booking | M | Email/Slack-free: email to owner |
| FR-35 | Cancellation/refund handling | S | Admin can cancel a departure and trigger refunds; policy text linked |
| FR-36 | Coupon/discount codes | C | Single-use and percentage codes, validated server-side |
| FR-37 | Booking lookup by reference + email | C | No account required |

### 7.5 Crea tu tour (quote request)

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-40 | Multi-step request form: group size, date(s), tour preference, budget, contact | M | Progress saved client-side; validation per step |
| FR-41 | Submission stored in DB + notification email + auto-reply | M | Stored even if email fails; spam protection (honeypot + rate limit) |
| FR-42 | Admin inbox for requests with status (new / quoted / won / lost) | S | Filterable list, notes |
| FR-43 | WhatsApp fallback CTA | M | Deep link with prefilled message |

### 7.6 Events (`/eventos`)

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-50 | Agenda list/calendar of upcoming events | M | Sorted by date, past events hidden |
| FR-51 | Event detail: date, time, place, price, description, CTA | M | CTA link (booking/WhatsApp/registration) configurable |
| FR-52 | Ticketing/seating | C | Only if FooEvents ticketing is still required; otherwise external/WhatsApp registration |
| FR-53 | Event schema | S | Google Event schema |

### 7.7 Blog

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-60 | Blog index with cover, title, excerpt, date, reading time | M | Paginated; ISR/revalidation |
| FR-61 | Article page with rich text, images, headings, internal links | M | Migrated HTML sanitised; images optimised |
| FR-62 | Related posts + CTA to tours | S | |
| FR-63 | Article schema + OG + canonical | M | |
| FR-64 | Comments | C | Out of scope unless required; WhatsApp/email feedback instead |

### 7.8 Static pages

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-70 | About page with team/values/imagery | M | Content editable in admin |
| FR-71 | FAQ with categories, search | M | Accordion + FAQPage schema |
| FR-72 | Contact form (name, email, message, consent) + WhatsApp/phone | M | Rate-limited, spam-protected, stored + emailed |
| FR-73 | Legal pages (5) | M | Current text migrated verbatim; cookie policy reflects new tools |
| FR-74 | 404 page | M | Search + top tours + home link |

### 7.9 Admin

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-80 | Supabase Auth login, role-based access (owner, editor) | M | Only invited users; MFA available |
| FR-81 | CRUD tours, departures, capacity, prices, media | M | Changes revalidate public pages within 60 s |
| FR-82 | Bookings list/detail, manual booking, refund trigger, resend email | M | Role-gated; audit trail |
| FR-83 | Blog/pages editor (rich text, cover, SEO fields) | M | Draft/published states, preview |
| FR-84 | Quote requests inbox | S | Status + notes |
| FR-85 | Reviews moderation | S | Approve/hide |
| FR-86 | Site settings (phone, WhatsApp, email, social, banner) | S | No deploy needed |
| FR-87 | Media library (Supabase Storage) | M | Upload, alt text, delete guarded |
| FR-88 | Redirect manager | C | DB-driven, cached |

### 7.10 Cross-cutting

| ID | Requirement | Priority |
|---|---|---|
| FR-90 | Cookie consent banner with granular categories + GA4 consent mode | M |
| FR-91 | Analytics events (view_tour, begin_checkout, purchase, submit_quote, submit_contact) | M |
| FR-92 | Transactional email templates (confirmation, owner alert, quote auto-reply, contact auto-reply) | M |
| FR-93 | Rate limiting on all public forms and checkout endpoints | M |
| FR-94 | Sitemap.xml, robots.txt, RSS (optional) | M |
| FR-95 | Structured data: Organization, WebSite, Product/TouristTrip, FAQPage, Article, Event, BreadcrumbList | M |
| FR-96 | hreflang + localized metadata when EN ships | S |

---

## 8. Data model (Supabase / Postgres)

All tables in `public`, RLS enabled, `updated_at` triggers, UUID PKs. Public read policies only for published rows; writes go through server actions using the service role or authenticated admin with role checks.

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | id (auth.users), full_name, role (`owner`/`editor`), created_at | Role in `app_metadata` too |
| `tours` | id, slug, title, subtitle, area, duration_minutes, difficulty, price_from_cents, summary, description (jsonb), highlights (jsonb), inclusions (jsonb), exclusions (jsonb), packing_list (jsonb), meeting_point, map_url, hero_image_id, video_url, status, seo_title, seo_description, published_at | `description` = portable rich text (Tiptap JSON) |
| `tour_departures` | id, tour_id, starts_at, ends_at, capacity, seats_taken, price_cents, status (`open`/`sold_out`/`cancelled`), notes | Unique(tour_id, starts_at) |
| `tour_images` | id, tour_id, storage_path, alt, sort_order | |
| `tour_itinerary` | id, tour_id, sort_order, time_label, title, body | Timeline |
| `tour_faqs` | id, tour_id, question, answer, sort_order | |
| `bookings` | id, reference, departure_id, customer_name, email, phone, travellers, total_cents, status (`pending`/`paid`/`cancelled`/`refunded`), notes, created_at | Reference human-readable (`TC-2026-0001`) |
| `booking_travellers` | id, booking_id, name, age_group, notes | Optional at launch |
| `payments` | id, booking_id, provider, provider_ref, amount_cents, status, raw_event jsonb, created_at | Idempotent webhook storage |
| `tour_requests` | id, name, email, phone, group_size, preferred_dates, tour_id, budget, message, status, admin_notes | Crea tu tour |
| `events` | id, slug, title, starts_at, ends_at, location, price_cents, description, image_id, cta_url, cta_label, status | |
| `posts` | id, slug, title, excerpt, cover_id, content (jsonb), status, published_at, seo_title, seo_description, reading_minutes | Blog |
| `pages` | id, slug, title, content (jsonb), status, seo_title, seo_description | About, legal, FAQ intro |
| `faqs` | id, category, question, answer, sort_order, status | Global FAQ |
| `reviews` | id, author, source, rating, text, tour_id, status, created_at | Real reviews only |
| `media` | id, bucket, path, alt, width, height, mime, size_bytes | Maps Supabase Storage |
| `settings` | key, value jsonb | Phone, WhatsApp, email, socials, banner |
| `redirects` | id, from_path, to_path, status_code | Optional |
| `leads` | id, source, payload jsonb, created_at | Newsletter/contact fallback |
| `audit_log` | id, actor, action, entity, entity_id, diff jsonb, created_at | Admin traceability |

Storage buckets: `media` (public read), `private-docs` (invoices later, private).

Capacity integrity: a Postgres function `hold_seats(departure_id, qty)` updates `seats_taken` with `UPDATE ... WHERE seats_taken + qty <= capacity` inside a transaction; checkout calls it, and a scheduled job releases expired holds.

---

## 9. Technical architecture

```
Browser
  │  HTTPS
  ▼
Vercel Edge (DNS, TLS, caching, image optimizer)
  │
  ├── Next.js App Router (RSC + server actions)
  │     ├── Public pages (SSG/ISR, revalidate on publish)
  │     ├── Booking API (server actions + route handlers)
  │     └── Admin (auth-gated, dynamic)
  │
  ├── Supabase
  │     ├── Postgres (data + RLS + RPC for seat holds)
  │     ├── Auth (admin users; customer magic links later)
  │     └── Storage (images, video poster, docs)
  │
  ├── Stripe (or PayTPV/Redsys) — payments + webhooks
  ├── Resend — transactional email
  ├── Vercel Analytics + GA4/GTM — analytics with consent mode
  └── Sentry (optional) — error monitoring
```

**No WordPress in production.** There is no PHP runtime, no wp-admin, no plugins and no theme in the deployed system. The legacy WordPress site is read-only during migration and is shut down after cutover.

### 9.1 Stack choices

- **Framework:** Next.js (latest stable App Router), TypeScript strict, React Server Components.
- **Styling:** Tailwind CSS v4 + a small component layer (shadcn/ui primitives or hand-rolled). Design tokens from `booking.md` (navy `#003580`, yellow `#feba02`, blue `#0071c2`, border `#e7e7e7`/`#bdbdbd`, radii 4/8/12, body 14px).
- **Fonts:** self-hosted via `next/font` (one display + one text family; avoid 4+ weights).
- **Data:** `@supabase/supabase-js` + `@supabase/ssr`, generated DB types, SQL migrations via Supabase CLI.
- **Validation:** Zod schemas shared between forms and server actions.
- **Forms:** React Hook Form + server actions; progressive enhancement where feasible.
- **Rich text:** Tiptap JSON stored in `jsonb`, rendered by a typed renderer (no `dangerouslySetInnerHTML` for new content; sanitise migrated HTML once at import).
- **Email:** Resend + React Email templates.
- **Payments:** Stripe Payment Element/Checkout (recommended). If the merchant contract mandates PayTPV/Redsys, implement Redsys HMAC + 3DS redirect flow instead; scope increases by ~4–6 dev-days.
- **Video:** re-encode hero to H.264/HEVC + WebM, ≤ 6 MB for the first 8 s, `preload="metadata"`, poster; long-term move to a streaming provider if more video is added.
- **Maps:** static map image or link to Google Maps (no embedded map JS at launch).

### 9.2 Rendering and caching

- Home, catalog, tour pages, blog, static pages: statically generated with ISR.
- Revalidation: on admin publish via `revalidateTag`/`revalidatePath`; time-based fallback (e.g., 1 h) for departures/availability.
- Availability widget: server-rendered per request (or client fetch to a cached endpoint with `no-store` for seats).
- Checkout/admin: dynamic, never cached.
- Images: `next/image`, AVIF/WebP, explicit dimensions, priority only for hero poster.

### 9.3 Environments

| Env | Purpose | Supabase | Payments |
|---|---|---|---|
| Local | Development | Local Supabase (Docker) or branch DB | Stripe test keys |
| Preview | Every PR (Vercel preview) | Supabase branch or shared staging schema | Stripe test |
| Production | Live | Supabase production project | Live keys |

Secrets only in Vercel env vars / Supabase secrets; never in the repo. `.env.example` documents names.

### 9.4 Security and privacy

- RLS on every table; service role key only on the server.
- Admin routes protected by middleware + server-side role check (not just UI hiding).
- Rate limiting on `/api/*` forms and checkout (Upstash Redis or Vercel KV; simple IP+route token bucket).
- Webhook signature verification (Stripe/Redsys) and idempotency keys.
- CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`; no inline scripts except GTM via nonce.
- GDPR: consent before analytics/marketing tags; privacy policy updated for Supabase/Vercel/Stripe/Resend; data retention policy for bookings (e.g., 6 years for invoices) and quote requests (e.g., 24 months).
- Backups: Supabase daily backups (Pro) + weekly logical dump to storage; documented restore drill.

---

## 10. SEO and content migration

### 10.1 SEO requirements

- 1:1 or 301 mapping for every URL in the current sitemap (export before cutover).
- Metadata per page from DB (`seo_title`, `seo_description`), OG/Twitter images generated per tour/article.
- Structured data: `Organization` + `WebSite` (home), `Product` or `TouristTrip` + `Offer` (tour), `FAQPage`, `Article`, `Event`, `BreadcrumbList`.
- Canonical URLs, `robots.txt`, XML sitemap generated from DB.
- Spanish default; `hreflang` only when EN content is genuinely translated.
- Image alt text migrated/rewritten; no keyword stuffing.
- Redirect tests in CI: crawl the old URL list against preview and assert 200/301.

### 10.2 Migration steps

1. Extract legacy content once: pages, posts, products, categories, media, menus and SEO metadata (via REST/XML export if available). No WordPress code, theme or plugin is reused. If the owner prefers, skip the export entirely and enter the same content directly in the new admin — the build does not depend on WordPress running.
2. Freeze content 5 days before cutover; no edits on WP except critical price changes.
3. Map each tour to the new schema; confirm departures, prices, capacity, meeting point, inclusions.
4. Download and optimise media (max 2000 px, AVIF/WebP derivatives), upload to Supabase Storage with stable paths.
5. Convert article HTML to sanitised rich text; keep tables/lists/links; re-host images.
6. Rewrite legal pages only where tools changed (cookies, processors); keep business terms verbatim.
7. Build redirect map; test on preview with a crawler.
8. Final QA on preview with `noindex`; flip DNS at low-traffic window; submit sitemap; monitor 404s and Search Console for 14 days.

### 10.3 Content ownership

The owner supplies: tour descriptions, prices, departure dates/capacity, cancellation policy text, company/legal details (NIF, address), review quotes with permission, and brand assets. The build does not invent business facts.

---

## 11. Internationalisation

- Launch: Spanish only (`es`), root URLs.
- Phase 1B: English (`/en/...`) using `next-intl` with locale-prefixed routes and `hreflang`.
- Content translations live in `*_translations` tables (or `jsonb` locale maps) so the admin edits each language explicitly.
- No machine translation in production without owner review.
- UI strings in `messages/es.json`, `messages/en.json`.

---

## 12. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Mobile LCP ≤ 2.5 s p75; initial JS ≤ 200 KB gzip on public pages; hero video not blocking LCP |
| Availability | 99.9% monthly; graceful degradation if Supabase is slow (cached catalog) |
| Accessibility | WCAG 2.2 AA: contrast, focus visible, keyboard nav, labels, reduced motion, alt text |
| Browsers | Last 2 versions of Chrome/Safari/Firefox/Edge + iOS Safari 16+ |
| Responsive | 360 px → 1920 px; breakpoints 640/768/1024/1280 |
| Observability | Vercel logs + Speed Insights; error tracking; uptime check on home and checkout |
| Maintainability | TypeScript strict, ESLint/Prettier, CI typecheck + lint + unit + e2e smoke |
| Documentation | README with setup, env vars, migration and deploy runbook |

---

## 13. Analytics events

| Event | When | Params |
|---|---|---|
| `view_item_list` | catalog view | list_id, filters |
| `view_item` | tour detail | tour_slug, price_from |
| `select_departure` | date chosen | tour_slug, date, seats_left |
| `begin_checkout` | checkout start | tour_slug, date, value |
| `purchase` | payment confirmed (server-side + client) | transaction_id, value, currency, items |
| `submit_quote` | Crea tu tour sent | group_size, tour_slug |
| `submit_contact` | contact form sent | — |
| `whatsapp_click` | any WhatsApp CTA | location |

Server-side `purchase` via Stripe webhook → GA4 Measurement Protocol (optional) to avoid ad-blocker loss.

---

## 14. Decisions required before build

Status of each decision is tracked in [`docs/decisions.md`](decisions.md).

| # | Decision | Options | Recommendation | Owner |
|---|---|---|---|---|
| D1 | Payment provider | Stripe / PayTPV-Redsys (current contract) | Stripe unless merchant contract forbids it; confirm fees and settlement | Ayoub |
| D2 | Languages at launch | ES only / ES+EN | ES at launch, EN within 6 weeks | Ayoub |
| D3 | Events ticketing | Keep FooEvents-like ticketing / listing + external CTA | Listing + CTA at launch; ticketing only if volume justifies | Ayoub |
| D4 | Customer accounts | Guest only / magic-link accounts | Guest only at launch | Ayoub |
| D5 | Invoicing | Manual / Stripe Invoicing / external | Manual at launch; automate later | Ayoub |
| D6 | Reviews source | Google / TripAdvisor / manual | Manual entries with attribution; no scraping | Ayoub |
| D7 | Email sender domain | `tripcelona.com` | Set up SPF/DKIM/DMARC before launch | Ayoub |
| D8 | Analytics/consent | GTM + GA4 + custom banner / CMP vendor | Keep GTM+GA4 with a lightweight consent banner | Ayoub |
| D9 | Domain/DNS | Keep registrar, point to Vercel | Lower TTL 24 h before cutover | Ayoub |
| D10 | Legacy WP retention | Retire / keep read-only 30 days | Keep at `old.tripcelona.com` 30 days | Ayoub |

---

## 15. Launch acceptance criteria

- [ ] All public pages render on mobile and desktop with final content (no lorem, no placeholder prices).
- [ ] Booking flow completes with a live card (small real transaction) and confirmation email arrives.
- [ ] Capacity cannot be oversold in a 10-parallel-request test.
- [ ] Every URL from the old sitemap returns 200 or 301; crawl shows 0 unexpected 404s.
- [ ] Lighthouse mobile ≥ 90 performance / ≥ 95 accessibility on home and one tour.
- [ ] Structured data validates for tour, FAQ, article and event pages.
- [ ] Legal pages, cookie banner and consent mode behave correctly (analytics blocked before consent).
- [ ] Admin can create a departure, edit a price and publish a blog post without a deploy.
- [ ] Backups configured and a restore has been tested on staging.
- [ ] Monitoring/alerting live; rollback plan documented and rehearsed.

---

## 16. Out of scope for v1 (backlog candidates)

- Customer accounts with booking history and self-service changes.
- Multi-day tours, gift cards, waitlists.
- Automated invoicing/accounting integration.
- Blog comments, newsletter automation beyond a simple list.
- A/B testing framework.
- Native app / PWA push.

---

## Appendix A — Environment variables (names only)

```
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
EMAIL_FROM
OWNER_EMAIL
NEXT_PUBLIC_GTM_ID
UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (if used)
SENTRY_DSN (optional)
```

## Appendix B — Design tokens (from booking.md)

- Navy `#003580` (primary/brand), yellow `#feba02` (accent ring/CTA highlights), blue `#0071c2` (actions), ink `#1a1a1a`, muted `#595959`, borders `#e7e7e7` / `#bdbdbd`, surfaces `#ffffff` / `#f5f7fa`.
- Radii: 4 px controls, 8 px cards, 12 px panels.
- Search bar: 56 px, 5 px yellow ring, white panel, 4 px radius.
- Type: 700 display, 400 body, 14 px base, tight heading leading.
