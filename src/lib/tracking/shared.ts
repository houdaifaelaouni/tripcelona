/**
 * Ad tracking pieces shared by the server and the browser: the public pixel
 * ids, the consent cookie and the attribution cookie (UTM tags and click ids
 * the visitor arrived with). No secrets here: tokens live in
 * lib/tracking/secrets.ts.
 */

export type TrackingConfig = {
  metaPixelId: string | null;
  tiktokPixelId: string | null;
  gtmId: string | null;
  ga4Id: string | null;
  googleAdsId: string | null;
  googleAdsPurchaseLabel: string | null;
};

/** Format of each public id, as the platforms show it. */
export const TRACKING_PATTERNS: Record<keyof TrackingConfig, RegExp> = {
  metaPixelId: /^\d{10,20}$/,
  tiktokPixelId: /^[A-Z0-9]{15,25}$/,
  gtmId: /^GTM-[A-Z0-9]{4,12}$/,
  ga4Id: /^G-[A-Z0-9]{4,16}$/,
  googleAdsId: /^AW-\d{6,14}$/,
  googleAdsPurchaseLabel: /^[A-Za-z0-9_-]{4,40}$/,
};

export const TRACKING_KEYS = Object.keys(TRACKING_PATTERNS) as (keyof TrackingConfig)[];

export function trackingFromValue(value: unknown): TrackingConfig {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return Object.fromEntries(
    TRACKING_KEYS.map((k) => {
      const v = typeof raw[k] === "string" ? (raw[k] as string).trim() : "";
      return [k, TRACKING_PATTERNS[k].test(v) ? v : null];
    }),
  ) as TrackingConfig;
}

export const anyTracking = (c: TrackingConfig) =>
  !!(c.metaPixelId || c.tiktokPixelId || c.gtmId || c.ga4Id || c.googleAdsId);

/** "granted" after "Aceptar", "denied" after "Rechazar". Kept 6 months. */
export const CONSENT_COOKIE = "tc_consent";
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 182;

/** Where the visitor came from, saved on the booking when they buy. */
export const ATTRIBUTION_COOKIE = "tc_attr";
/** With consent the source is remembered 90 days; without, only for the visit. */
export const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 90;

export const ATTRIBUTION_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "ttclid",
] as const;

export type Attribution = Partial<
  Record<(typeof ATTRIBUTION_PARAMS)[number] | "landing" | "referrer" | "at", string>
>;

const clean = (v: unknown, max = 200) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;

/** Reads the cookie value back, keeping only known keys and short strings. */
export function parseAttribution(raw: string | undefined | null): Attribution | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const out: Attribution = {};
    for (const k of [...ATTRIBUTION_PARAMS, "landing", "referrer", "at"] as const) {
      const v = clean(data[k], k === "fbclid" || k === "gclid" || k === "ttclid" ? 500 : 200);
      if (v) out[k] = v;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

/**
 * The attribution of a page view, or null when the visit carries no campaign
 * signal (then the earlier one is kept: last non-direct click wins).
 */
export function attributionFromUrl(url: URL, referrer: string): Attribution | null {
  const out: Attribution = {};
  for (const k of ATTRIBUTION_PARAMS) {
    const v = clean(url.searchParams.get(k), k.endsWith("clid") ? 500 : 200);
    if (v) out[k] = v;
  }
  let externalReferrer: string | undefined;
  try {
    if (referrer && new URL(referrer).host !== url.host) externalReferrer = referrer;
  } catch {
    // not a URL: ignore
  }
  if (!Object.keys(out).length && !externalReferrer) return null;
  if (!out.utm_source && externalReferrer) {
    const host = new URL(externalReferrer).hostname.replace(/^www\./, "");
    out.utm_source = out.fbclid ? "facebook" : out.gclid ? "google" : out.ttclid ? "tiktok" : host;
    out.utm_medium = out.fbclid || out.gclid || out.ttclid ? "paid" : "referral";
  }
  if (!out.utm_source && (out.fbclid || out.gclid || out.ttclid)) {
    out.utm_source = out.fbclid ? "facebook" : out.gclid ? "google" : "tiktok";
    out.utm_medium = "paid";
  }
  out.landing = (url.pathname + url.search).slice(0, 200);
  if (externalReferrer) out.referrer = externalReferrer.slice(0, 200);
  out.at = new Date().toISOString();
  return out;
}

/** Browser-side events, named as Meta names them. */
export type TrackEventName = "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase" | "Lead";

export type TrackItem = { id: string; name: string; priceCents: number; quantity: number };
