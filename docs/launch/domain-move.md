# Moving the site to tripcelona.com

Short, ordered version of the cutover for the owner. The full runbook with
rehearsal and rollback is in `runbook.md`.

The code reads its own address from `NEXT_PUBLIC_SITE_URL` everywhere
(canonical and hreflang tags, sitemap, robots, JSON-LD, payment return and
notification URLs, email links, admin invite links, calendar files). Nothing
else in the code needs to change for the new domain.

## The one trap: photos

All 57 product and blog photos are still loaded from the old WordPress
(`https://tripcelona.com/wp-content/uploads/...`). The moment tripcelona.com
points to Vercel, those URLs stop reaching WordPress. So the photos must be
copied into Supabase Storage **before** DNS changes.

1. Admin → Medios → **Copiar imágenes de WordPress**. Press until it says
   "Todas las imágenes están copiadas" (about 40 s per press).
2. Vercel → Settings → Environment Variables (Production):
   `MEDIA_FROM_STORAGE=true`, then redeploy.
3. Check that https://tripcelona.vercel.app shows every photo.

Safety net (optional): keep the old WordPress reachable on a subdomain such as
`antiguo.tripcelona.com` and set `LEGACY_WP_ORIGIN=https://antiguo.tripcelona.com`.
Any old image that was not copied then redirects there instead of a 404.

## Ordered checklist

1. **Photos**: the three steps above.
2. **DNS TTL**: at the DNS provider, lower the TTL of `@` and `www` to 300 s
   a day before. Write down the current WordPress records (for rollback).
   Do **not** touch MX, SPF or other mail records.
3. **Vercel env (Production)**: `NEXT_PUBLIC_SITE_URL=https://tripcelona.com`
   and `NEXT_PUBLIC_ALLOW_INDEXING=true`. Redeploy (both are read at build time).
4. **Supabase → Authentication → URL Configuration**: Site URL
   `https://tripcelona.com`; add redirect URL
   `https://tripcelona.com/admin/auth/confirm` (keep the vercel.app one until
   the move is done).
5. **Vercel → Domains**: add `tripcelona.com` and `www.tripcelona.com`
   (redirect `www` to the apex). Vercel shows the records to set, usually
   `A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com`. Set them at the DNS
   provider and wait until Vercel shows "Valid Configuration" and a certificate.
6. **Payments** (the admin Pagos page lists the exact URLs):
   - Stripe → Developers → Webhooks: endpoint
     `https://tripcelona.com/api/pagos/stripe/webhook`. If you create a new
     endpoint, paste its new signing secret in Admin → Pagos.
   - PAYCOMET → product settings: notification URL
     `https://tripcelona.com/api/pagos/paycomet/notificacion`.
   - Redsys: nothing, the URL is sent with each payment.
7. **Email**: verify `tripcelona.com` in Resend (adds SPF/DKIM DNS records),
   then set `EMAIL_FROM` to an address on it.
8. **Check**: open the home, a tour, checkout up to the payment page, the
   contact form and the admin login on `https://tripcelona.com`. Old WordPress
   links (`/product/...`, blog posts) redirect automatically (`migration/urls.csv`).
9. **Google Search Console**: submit `https://tripcelona.com/sitemap.xml`.

**Rollback**: put the WordPress DNS records from step 2 back. With TTL 300 s
visitors are back on WordPress within minutes.
