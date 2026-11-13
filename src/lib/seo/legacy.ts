/**
 * Legacy WordPress URLs (US-33). The source of truth is migration/urls.csv;
 * tests/unit/legacy.test.ts checks every row against these rules.
 *
 * Pure functions only: src/proxy.ts applies them on every request.
 */

/** Old blog posts lived at the site root (`/<slug>/`). */
const LEGACY_POSTS = new Set([
  "que-llevar-a-una-excursion-de-un-dia",
  "rupit-y-tavertet-pueblos-con-encanto",
  "vall-de-nuria-queralbs-excursion",
  "aiguestortes-lago-sant-maurici-guia",
  "fageda-den-jorda-castellfollit-de-la-roca",
  "excursiones-de-un-dia-desde-barcelona",
]);

const EXACT: Record<string, string> = {
  "/blogs": "/blog",
  "/cart": "/reservar",
  "/checkout": "/reservar",
  "/finalizar-compra": "/reservar",
  "/my-account": "/",
  "/mi-cuenta": "/",
  "/shop": "/ofertas-de-viajes",
  "/tienda": "/ofertas-de-viajes",
  "/sitemap_index.xml": "/sitemap.xml",
  "/post-sitemap.xml": "/sitemap.xml",
  "/page-sitemap.xml": "/sitemap.xml",
  "/product-sitemap.xml": "/sitemap.xml",
};

/** WordPress-only endpoints: answered with 410 Gone after the cutover. */
const GONE = [
  /^\/wp-admin(\/|$)/,
  /^\/wp-login\.php$/,
  /^\/xmlrpc\.php$/,
  /^\/wp-json(\/|$)/,
  /^\/wp-includes(\/|$)/,
  /^\/feed(\/|$)/,
  /^\/comments\/feed(\/|$)/,
  /^\/[^/]+\/feed$/,
];

/** Where an old path now lives, or null when it is not a legacy URL. Expects no trailing slash. */
export function legacyDestination(path: string): string | null {
  if (EXACT[path]) return EXACT[path];
  const product = /^\/(?:product|producto)\/([a-z0-9-]+)$/.exec(path);
  if (product) return `/excursiones/${product[1]}`;
  const root = /^\/([a-z0-9-]+)$/.exec(path);
  if (root && LEGACY_POSTS.has(root[1])) return `/blog/${root[1]}`;
  return null;
}

export function isGone(path: string): boolean {
  return GONE.some((re) => re.test(path));
}

/** Single-segment paths that belong to their own routes (not CMS pages). */
export const OWN_ROUTES = new Set([
  "",
  "admin",
  "api",
  "blog",
  "carrito",
  "contactanos",
  "crea-tu-tour",
  "excursiones",
  "health",
  "ofertas-de-viajes",
  "preguntas-frecuentes",
  "reservar",
  "wp-content",
]);

export type SlugKind = "page" | "post" | "tour";

/**
 * Which slug table a public path depends on, so the proxy can answer a real
 * 404 for unknown slugs (PPR would otherwise stream the not-found UI with 200).
 */
export function slugLookup(path: string): { kind: SlugKind; slug: string } | null {
  let m = /^\/blog\/([^/]+)$/.exec(path);
  if (m) return { kind: "post", slug: decodeURIComponent(m[1]) };
  m = /^\/excursiones\/([^/]+)$/.exec(path);
  if (m) return { kind: "tour", slug: decodeURIComponent(m[1]) };
  m = /^\/([^/.]+)$/.exec(path);
  if (m && !OWN_ROUTES.has(m[1])) return { kind: "page", slug: decodeURIComponent(m[1]) };
  return null;
}

/**
 * The URL to send a request to in one hop (trailing slash removed and legacy
 * mapping applied), or null when the path is already canonical.
 */
export function canonicalRedirect(path: string): string | null {
  const trimmed = path.length > 1 ? path.replace(/\/+$/, "") || "/" : path;
  const dest = legacyDestination(trimmed);
  if (dest) return dest;
  return trimmed !== path ? trimmed : null;
}
