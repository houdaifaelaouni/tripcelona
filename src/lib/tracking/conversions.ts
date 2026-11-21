import "server-only";
import { createHash } from "node:crypto";
import { siteUrl } from "@/lib/seo/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BookingAttribution } from "./attribution-server";
import { getTrackingConfig } from "./config";
import { integrationSecrets } from "./secrets";

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

/** E.164 digits without "+", as Meta and TikTok hash phones. Spanish numbers get 34. */
export function normalisePhone(raw: string | null): string | null {
  if (!raw) return null;
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (/^[6789]\d{8}$/.test(d)) d = `34${d}`;
  return d.length >= 8 ? d : null;
}

export type PurchaseFacts = {
  eventId: string;
  reference: string;
  email: string;
  phone: string | null;
  valueCents: number;
  items: { id: string; name: string; quantity: number; priceCents: number }[];
  attribution: BookingAttribution | null;
};

export function metaPurchaseEvent(p: PurchaseFacts, now = Date.now()) {
  const a = p.attribution ?? {};
  const phone = normalisePhone(p.phone);
  return {
    event_name: "Purchase",
    event_time: Math.floor(now / 1000),
    event_id: p.eventId,
    action_source: "website",
    event_source_url: siteUrl() + "/reservar/confirmada",
    user_data: {
      em: [sha256(p.email.trim().toLowerCase())],
      ...(phone ? { ph: [sha256(phone)] } : {}),
      ...(a.fbp ? { fbp: a.fbp } : {}),
      ...(a.fbc ? { fbc: a.fbc } : {}),
      ...(a.ip ? { client_ip_address: a.ip } : {}),
      ...(a.ua ? { client_user_agent: a.ua } : {}),
    },
    custom_data: {
      currency: "EUR",
      value: p.valueCents / 100,
      order_id: p.reference,
      content_type: "product",
      content_ids: p.items.map((i) => i.id),
      contents: p.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        item_price: i.priceCents / 100,
      })),
      num_items: p.items.reduce((n, i) => n + i.quantity, 0),
    },
  };
}

export function tiktokPurchaseEvent(p: PurchaseFacts, now = Date.now()) {
  const a = p.attribution ?? {};
  const phone = normalisePhone(p.phone);
  return {
    event: "CompletePayment",
    event_time: Math.floor(now / 1000),
    event_id: p.eventId,
    user: {
      email: sha256(p.email.trim().toLowerCase()),
      ...(phone ? { phone: sha256(`+${phone}`) } : {}),
      ...(a.ttclid ? { ttclid: a.ttclid } : {}),
      ...(a.ttp ? { ttp: a.ttp } : {}),
      ...(a.ip ? { ip: a.ip } : {}),
      ...(a.ua ? { user_agent: a.ua } : {}),
    },
    page: { url: siteUrl() + "/reservar/confirmada" },
    properties: {
      currency: "EUR",
      value: p.valueCents / 100,
      order_id: p.reference,
      content_type: "product",
      contents: p.items.map((i) => ({
        content_id: i.id,
        content_name: i.name,
        quantity: i.quantity,
        price: i.priceCents / 100,
      })),
    },
  };
}

/** The purchase as one event: a cart payment is one purchase of several trips. */
async function purchaseFacts(bookingIds: string[]): Promise<PurchaseFacts | null> {
  const { data, error } = await createAdminClient()
    .from("bookings")
    .select(
      "id, reference, email, phone, travellers, total_cents, attribution, departure_id, tour_departures!inner(tours!inner(slug, title))",
    )
    .in("id", bookingIds)
    .order("created_at");
  if (error || !data?.length) return null;
  const first = data[0];
  return {
    eventId: first.id,
    reference: first.reference,
    email: first.email,
    phone: first.phone,
    valueCents: data.reduce((n, b) => n + b.total_cents, 0),
    items: data.map((b) => ({
      id: b.tour_departures.tours.slug,
      name: b.tour_departures.tours.title,
      quantity: b.travellers,
      priceCents: Math.round(b.total_cents / b.travellers),
    })),
    attribution: (first.attribution as BookingAttribution | null) ?? null,
  };
}

/**
 * Server-side Purchase for Meta (Conversions API) and TikTok (Events API),
 * sent when the bank confirms the payment. Same event id as the browser
 * pixel, so the platforms count it once. Only for buyers who accepted
 * cookies. Never throws: tracking must not break a payment.
 */
export async function sendServerPurchase(bookingIds: string[]): Promise<void> {
  try {
    const facts = await purchaseFacts(bookingIds);
    if (!facts?.attribution?.consent) return;
    const [config, secrets] = await Promise.all([getTrackingConfig(), integrationSecrets()]);
    const jobs: Promise<unknown>[] = [];
    if (config.metaPixelId && secrets.META_CAPI_TOKEN) {
      jobs.push(
        post(
          `https://graph.facebook.com/v21.0/${config.metaPixelId}/events?access_token=${encodeURIComponent(secrets.META_CAPI_TOKEN)}`,
          {
            data: [metaPurchaseEvent(facts)],
            ...(secrets.META_TEST_EVENT_CODE
              ? { test_event_code: secrets.META_TEST_EVENT_CODE }
              : {}),
          },
          {},
          "meta",
        ),
      );
    }
    if (config.tiktokPixelId && secrets.TIKTOK_EVENTS_TOKEN) {
      jobs.push(
        post(
          "https://business-api.tiktok.com/open_api/v1.3/event/track/",
          {
            event_source: "web",
            event_source_id: config.tiktokPixelId,
            ...(secrets.TIKTOK_TEST_EVENT_CODE
              ? { test_event_code: secrets.TIKTOK_TEST_EVENT_CODE }
              : {}),
            data: [tiktokPurchaseEvent(facts)],
          },
          { "Access-Token": secrets.TIKTOK_EVENTS_TOKEN },
          "tiktok",
        ),
      );
    }
    await Promise.all(jobs);
  } catch (error) {
    console.error("[tracking] server purchase failed", error);
  }
}

async function post(url: string, body: unknown, extra: Record<string, string>, who: string) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...extra },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok)
      console.error(`[tracking] ${who} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  } catch (error) {
    console.error(`[tracking] ${who} unreachable`, error);
  }
}
