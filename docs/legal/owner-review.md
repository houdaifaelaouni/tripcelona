# Legal and content review for the owner (Sprint 8)

The legal pages were imported **word for word** from the WordPress site. Nothing
in them was rewritten. This note lists what no longer matches the new site, so
the owner (or their adviser) can decide what to change. **We have not written
any legal text.**

All of these pages can be edited in **Admin → Páginas**. Only the owner can
change legal pages.

## 1. Cookie policy (blocking for launch)

- The old `/politica-de-cookies` page contained only a Complianz plugin
  shortcode, so there was no text to move. That URL returns "page not
  found" until a text exists.
- When the owner has the text: create a page in Admin → Páginas with the URL
  `politica-de-cookies`, set **Tipo** to "Página legal", and publish it. The footer
  link already points there.
- What the new site actually stores on a visitor's device, checked in the
  code (Sprint 8):

  | What | Where | Purpose |
  | --- | --- | --- |
  | Supabase sign-in cookies (`sb-…`) | `/admin` only, for staff | Keeps staff signed in. Strictly necessary. |
  | `localStorage` key for the "Crea tu tour" form | Visitor's browser, only after they start typing | Keeps form progress if the page is reloaded. It is cleared once the form is sent. |
  | Redsys payment page | On Redsys's own domain | Card payment. Redsys sets its own cookies there. |

  Public pages set **no cookies today**. There is no analytics yet.
- **Decision D8 (analytics and consent) is still open.** The plan suggests
  GTM + GA4 with a light consent banner. If analytics is added, the cookie
  policy and a consent banner must cover it before it goes live.

## 2. Privacy policy: providers that changed

The imported privacy policy lists these providers ("encargados del tratamiento"):

| Text in the policy | New site | Action |
| --- | --- | --- |
| "Entidad bancaria y Redsys, y Stripe, para procesar los pagos." | Payments use Redsys only (decision D1). Stripe is not used. | Owner to decide whether to remove Stripe. |
| "Hostinger, para el alojamiento de la web." | Hosting is Vercel. The database and file storage are Supabase. | Owner to update the hosting providers. |
| "Google, para la analítica web si aceptas las cookies analíticas." | No analytics today (see D8). | Keep or remove, depending on D8. |
| (not mentioned) | Emails are sent through Resend. | Owner to decide whether to add it. |

## 3. Legal identity

The legal pages use `[tripola dato="…"]` placeholders for the company holder,
tax ID (NIF) and address. They currently show **"(pendiente)"**. The owner
fills these in **Admin → Ajustes → Datos legales**, and every legal page then
updates.

## 4. Imported content that needs checking

- **Personal Gmail address.** Two FAQ answers give a personal Gmail address
  for contact: "¿Cómo sé si mi plaza está reservada…" and "¿Cómo puedo
  contactar con vosotros?". The legal pages use the site email from Ajustes
  instead. Owner to confirm which address to publish.
- **Meeting point.** The FAQ "¿Dónde comienzan nuestros viajes?" says
  "Avenida de la Reina María Cristina, en Plaza España". The rest of the site
  says "Estació del Nord, C/ d'Alí Bei 80". Owner to confirm which is right.
- **`/grupos`.** The old page held only booking-plugin shortcodes and no
  text, so it was not imported. It needs content, or a redirect.
- **"Andorra winter escape".** This product is dated in the future on the old
  site. Its description was not imported because no matching tour exists.
- The full import report is produced by
  `pnpm content:import --wxr <file> --report <path>` (see `migration/README.md`).
