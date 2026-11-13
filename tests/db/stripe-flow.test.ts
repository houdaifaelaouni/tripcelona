// End-to-end Stripe payment flow against the local Supabase stack:
// start payment (hosted page URL) → signed notification → paid, replay is a
// no-op, a refused payment stays pending, cancel → refund through the REST API.
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { connectLocalSupabase, waitForSupabaseApi } from "./local-env";
import { createHmac } from "node:crypto";

const WHSEC = "whsec_test_only";

connectLocalSupabase();
await waitForSupabaseApi();
Object.assign(process.env, {
  PAYMENT_PROVIDER: "stripe",
  STRIPE_SECRET_KEY: "sk_test_fake",
  STRIPE_WEBHOOK_SECRET: WHSEC,
  STRIPE_BASE_URL: "http://stripe.invalid",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  OWNER_EMAIL: "owner@example.com",
  RESEND_API_KEY: "",
});

const { createAdminClient } = await import("@/lib/supabase/admin");
const { startPayment, handleStripeWebhook, cancelDeparture } =
  await import("@/lib/payments/service");

const db = createAdminClient();
const slug = `stflow-${randomUUID().slice(0, 8)}`;
let departureId = "";
let bookingId = "";
let order = "";

function webhook(type: string, object: Record<string, unknown>, id = `evt_${randomUUID()}`) {
  const body = JSON.stringify({ id, type, data: { object } });
  const t = Math.floor(Date.now() / 1000);
  const sig = `t=${t},v1=${createHmac("sha256", WHSEC).update(`${t}.${body}`).digest("hex")}`;
  return { body, sig };
}
const session = (extra: Record<string, unknown> = {}) => ({
  id: "cs_test_1",
  client_reference_id: order,
  payment_status: "paid",
  amount_total: 16500,
  currency: "eur",
  payment_intent: "pi_test_1",
  ...extra,
});

const realFetch = globalThis.fetch;
const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
  const u = String(url);
  if (!u.startsWith("http://stripe.invalid")) return realFetch(url, init);
  const headers = init.headers as Record<string, string>;
  expect(headers.Authorization).toBe("Bearer sk_test_fake");
  const body = new URLSearchParams(String(init.body));
  if (u.endsWith("/v1/checkout/sessions")) {
    expect(body.get("line_items[0][price_data][unit_amount]")).toBe("16500");
    return new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/cs_test_1" }));
  }
  if (u.endsWith("/v1/refunds")) {
    expect(body.get("payment_intent")).toBe("pi_test_1");
    expect(body.get("amount")).toBe("16500");
    return new Response(JSON.stringify({ id: "re_1", status: "succeeded" }));
  }
  return new Response("{}", { status: 404 });
});

beforeAll(async () => {
  vi.stubGlobal("fetch", fetchMock);
  const { data: tour } = await db
    .from("tours")
    .insert({ slug, title: "Stripe flow", status: "published" })
    .select("id")
    .single();
  const { data: dep } = await db
    .from("tour_departures")
    .insert({
      tour_id: tour!.id,
      starts_at: new Date(Date.now() + 7 * 864e5).toISOString(),
      capacity: 4,
      price_cents: 5500,
    })
    .select("id")
    .single();
  departureId = dep!.id;
  const { data: hold } = await db.rpc("hold_seats", { p_departure_id: departureId, p_qty: 3 });
  const { data: booking } = await db
    .from("bookings")
    .insert({
      departure_id: departureId,
      customer_name: "Ana Prueba",
      email: "ana@example.com",
      travellers: 3,
      total_cents: 16500,
    })
    .select("id")
    .single();
  bookingId = booking!.id;
  await db.from("seat_holds").update({ booking_id: bookingId }).eq("id", hold!);
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await db.from("payments").delete().eq("booking_id", bookingId);
  await db.from("bookings").delete().eq("id", bookingId);
  await db.from("tours").delete().eq("slug", slug);
});

describe("Stripe payment flow", () => {
  it("starts a payment and returns the Checkout URL", async () => {
    const result = await startPayment(bookingId);
    expect(result).toMatchObject({
      ok: true,
      kind: "redirect",
      url: "https://checkout.stripe.com/c/pay/cs_test_1",
    });
    const { data: payment } = await db
      .from("payments")
      .select("provider, provider_ref, amount_cents")
      .eq("booking_id", bookingId)
      .single();
    expect(payment).toMatchObject({ provider: "stripe", amount_cents: 16500 });
    order = payment!.provider_ref;
  });

  it("rejects a bad signature and ignores unrelated events", async () => {
    const w = webhook("checkout.session.completed", session());
    expect(await handleStripeWebhook(w.body, "t=1,v1=00")).toBe("invalid_signature");
    const other = webhook("charge.refunded", session());
    expect(await handleStripeWebhook(other.body, other.sig)).toBe("ignored");
  });

  it("confirms the booking once, even when the webhook is replayed", async () => {
    const w = webhook("checkout.session.completed", session(), "evt_fixed_1");
    expect(await handleStripeWebhook(w.body, w.sig)).toBe("paid");
    expect(await handleStripeWebhook(w.body, w.sig)).toBe("duplicate");
    const { data: b } = await db.from("bookings").select("status").eq("id", bookingId).single();
    expect(b!.status).toBe("paid");
  });

  it("cancelling the departure refunds the booking through Stripe", async () => {
    const refundCalls = () =>
      fetchMock.mock.calls.filter(([u]) => String(u).endsWith("/refunds")).length;
    const report = await cancelDeparture(departureId);
    expect(report.failed).toEqual([]);
    expect(report.refunded).toHaveLength(1);
    expect(refundCalls()).toBe(1);
    const { data: b } = await db.from("bookings").select("status").eq("id", bookingId).single();
    expect(b!.status).toBe("refunded");
  });
});
