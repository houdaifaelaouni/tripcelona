"use client";

import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_MAX_AGE,
  attributionFromUrl,
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  parseAttribution,
  type TrackEventName,
  type TrackingConfig,
  type TrackItem,
} from "./shared";

type Fn = (...args: unknown[]) => void;
type TrackWindow = Window & {
  fbq?: Fn & { callMethod?: Fn; queue?: unknown[]; loaded?: boolean; version?: string; push?: Fn };
  _fbq?: unknown;
  ttq?: Record<string, Fn> & unknown[];
  TiktokAnalyticsObject?: string;
  dataLayer?: unknown[];
  gtag?: Fn;
  __tcTracking?: TrackingConfig;
  __tcPending?: Parameters<typeof track>[];
};
const w = () => window as TrackWindow;

export function readCookie(name: string): string | null {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

function writeCookie(name: string, value: string, maxAge?: number) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  const age = maxAge ? `; Max-Age=${maxAge}` : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${age}${secure}`;
}

export type Consent = "granted" | "denied" | null;
export const getConsent = (): Consent => {
  const v = readCookie(CONSENT_COOKIE);
  return v === "granted" || v === "denied" ? v : null;
};
export function setConsent(value: "granted" | "denied") {
  writeCookie(CONSENT_COOKIE, value, CONSENT_MAX_AGE);
  // Re-save the source with the right lifetime.
  const current = readCookie(ATTRIBUTION_COOKIE);
  if (current)
    writeCookie(ATTRIBUTION_COOKIE, current, value === "granted" ? ATTRIBUTION_MAX_AGE : undefined);
}

/**
 * Remembers the campaign the visitor arrived from (UTM tags, fbclid, gclid,
 * ttclid). Session-only until they accept cookies, then 90 days.
 */
export function captureAttribution() {
  const fresh = attributionFromUrl(new URL(location.href), document.referrer);
  if (!fresh) return;
  const previous = parseAttribution(readCookie(ATTRIBUTION_COOKIE));
  if (
    previous &&
    !fresh.utm_campaign &&
    !fresh.fbclid &&
    !fresh.gclid &&
    !fresh.ttclid &&
    previous.utm_campaign
  )
    return; // a plain referral does not overwrite a paid click
  writeCookie(
    ATTRIBUTION_COOKIE,
    JSON.stringify(fresh),
    getConsent() === "granted" ? ATTRIBUTION_MAX_AGE : undefined,
  );
}

function inject(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

/** Loads the configured pixels. Only called after "Aceptar". */
export function loadPixels(config: TrackingConfig) {
  const win = w();
  if (win.__tcTracking) return;
  win.__tcTracking = config;

  if (config.gtmId || config.ga4Id || config.googleAdsId) {
    win.dataLayer = win.dataLayer || [];
    win.gtag = function gtag() {
      // gtag.js only reads `arguments` objects.
      // eslint-disable-next-line prefer-rest-params
      win.dataLayer!.push(arguments);
    };
    win.gtag("consent", "default", {
      ad_storage: "granted",
      analytics_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
    if (config.gtmId) {
      win.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      inject(`https://www.googletagmanager.com/gtm.js?id=${config.gtmId}`);
    }
    const tagId = config.ga4Id ?? config.googleAdsId;
    if (tagId) {
      inject(`https://www.googletagmanager.com/gtag/js?id=${tagId}`);
      win.gtag("js", new Date());
      if (config.ga4Id) win.gtag("config", config.ga4Id);
      if (config.googleAdsId) win.gtag("config", config.googleAdsId);
    }
  }

  if (config.metaPixelId) {
    if (!win.fbq) {
      const n = function (...args: unknown[]) {
        if (n.callMethod) n.callMethod(...args);
        else n.queue!.push(args);
      } as NonNullable<TrackWindow["fbq"]>;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      win.fbq = n;
      win._fbq = n;
    }
    inject("https://connect.facebook.net/en_US/fbevents.js");
    win.fbq("init", config.metaPixelId);
    win.fbq("track", "PageView");
  }

  if (config.tiktokPixelId) {
    win.TiktokAnalyticsObject = "ttq";
    const ttq = (win.ttq = win.ttq || ([] as unknown as NonNullable<TrackWindow["ttq"]>));
    const methods = [
      "page",
      "track",
      "identify",
      "instances",
      "debug",
      "on",
      "off",
      "once",
      "ready",
      "alias",
      "group",
      "enableCookie",
      "disableCookie",
    ];
    for (const m of methods)
      ttq[m] = (...args: unknown[]) => {
        (ttq as unknown[]).push([m, ...args]);
      };
    inject(
      `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${config.tiktokPixelId}&lib=ttq`,
    );
    ttq.page();
  }

  // Events fired before the pixels were ready (the loader streams in late).
  for (const args of win.__tcPending?.splice(0) ?? []) track(...args);
}

/** Page view after a client-side navigation (the first one is sent on load). */
export function trackPageView() {
  const win = w();
  if (!win.__tcTracking) return;
  win.fbq?.("track", "PageView");
  win.ttq?.page?.();
}

const TIKTOK: Record<TrackEventName, string> = {
  ViewContent: "ViewContent",
  AddToCart: "AddToCart",
  InitiateCheckout: "InitiateCheckout",
  Purchase: "CompletePayment",
  Lead: "SubmitForm",
};
const GOOGLE: Record<TrackEventName, string> = {
  ViewContent: "view_item",
  AddToCart: "add_to_cart",
  InitiateCheckout: "begin_checkout",
  Purchase: "purchase",
  Lead: "generate_lead",
};

/**
 * One standard event to every configured platform. Does nothing without
 * consent. `eventId` lets Meta/TikTok merge it with the server event.
 */
export function track(
  name: TrackEventName,
  data: { items: TrackItem[]; eventId?: string; orderId?: string } = { items: [] },
) {
  const win = w();
  if (getConsent() !== "granted") return;
  const config = win.__tcTracking;
  if (!config) {
    const queue = (win.__tcPending ??= []);
    if (queue.length < 20) queue.push([name, data]);
    return;
  }
  const value = data.items.reduce((n, i) => n + i.priceCents * i.quantity, 0) / 100;
  const currency = "EUR";
  const eventId = data.eventId ?? `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (win.fbq) {
    win.fbq(
      "track",
      name,
      {
        currency,
        value,
        content_type: "product",
        content_ids: data.items.map((i) => i.id),
        content_name: data.items.map((i) => i.name).join(", "),
        contents: data.items.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          item_price: i.priceCents / 100,
        })),
        num_items: data.items.reduce((n, i) => n + i.quantity, 0),
      },
      { eventID: eventId },
    );
  }
  win.ttq?.track?.(
    TIKTOK[name],
    {
      currency,
      value,
      content_type: "product",
      contents: data.items.map((i) => ({
        content_id: i.id,
        content_name: i.name,
        quantity: i.quantity,
        price: i.priceCents / 100,
      })),
    },
    { event_id: eventId },
  );

  const ecommerce = {
    currency,
    value,
    ...(data.orderId ? { transaction_id: data.orderId } : {}),
    items: data.items.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      price: i.priceCents / 100,
      quantity: i.quantity,
    })),
  };
  if (config.gtmId) {
    win.dataLayer?.push({ ecommerce: null });
    win.dataLayer?.push({ event: GOOGLE[name], event_id: eventId, ecommerce });
  }
  if (win.gtag && (config.ga4Id || config.googleAdsId)) {
    win.gtag("event", GOOGLE[name], ecommerce);
    if (name === "Purchase" && config.googleAdsId && config.googleAdsPurchaseLabel)
      win.gtag("event", "conversion", {
        send_to: `${config.googleAdsId}/${config.googleAdsPurchaseLabel}`,
        value,
        currency,
        transaction_id: data.orderId ?? eventId,
      });
  }
}
