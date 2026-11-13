import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildCheckoutSession, interpretEvent, verifyWebhook } from "@/lib/payments/stripe";

// Made-up secret for tests; the real one lives in Vercel env.
const secret = "whsec_test_only";
const now = 1_800_000_000_000;
const sign = (body: string, t = now / 1000) =>
  `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
const event = (type: string, object: Record<string, unknown>) =>
  JSON.stringify({ id: "evt_1", type, data: { object } });

describe("Stripe webhook signature", () => {
  const body = event("checkout.session.completed", { client_reference_id: "O1" });
  it("accepts a valid signature", () => {
    expect(verifyWebhook(secret, body, sign(body), now)?.id).toBe("evt_1");
  });
  it("rejects a tampered body, wrong secret, old timestamp and missing header", () => {
    expect(verifyWebhook(secret, body + " ", sign(body), now)).toBeNull();
    expect(verifyWebhook("whsec_other", body, sign(body), now)).toBeNull();
    expect(verifyWebhook(secret, body, sign(body, now / 1000 - 600), now)).toBeNull();
    expect(verifyWebhook(secret, body, null, now)).toBeNull();
    expect(verifyWebhook(secret, body, "t=abc,v1=zz", now)).toBeNull();
  });
});

describe("Stripe events", () => {
  const paid = {
    id: "cs_1",
    client_reference_id: "ORDER1",
    payment_status: "paid",
    amount_total: 16500,
    currency: "eur",
    payment_intent: "pi_1",
  };
  it("a paid session is authorised and keeps the payment intent", () => {
    const r = interpretEvent(JSON.parse(event("checkout.session.completed", paid)));
    expect(r).toMatchObject({ order: "ORDER1", authorized: true, amountCents: 16500 });
    expect(r?.payload.payment_intent).toBe("pi_1");
  });
  it("an unpaid completed session waits; async failure fails", () => {
    const unpaid = { ...paid, payment_status: "unpaid" };
    expect(interpretEvent(JSON.parse(event("checkout.session.completed", unpaid)))).toBeNull();
    const f = interpretEvent(JSON.parse(event("checkout.session.async_payment_failed", unpaid)));
    expect(f?.authorized).toBe(false);
  });
  it("ignores other event types", () => {
    expect(interpretEvent(JSON.parse(event("charge.refunded", paid)))).toBeNull();
  });
  it("builds a card-only EUR session with the order reference", () => {
    const p = buildCheckoutSession({
      order: "ORDER1",
      amountCents: 16500,
      description: "TC-1 · Tour",
      okUrl: "https://x/ok",
      koUrl: "https://x/ko",
      expiresAt: 1,
    });
    expect(p.get("client_reference_id")).toBe("ORDER1");
    expect(p.get("line_items[0][price_data][unit_amount]")).toBe("16500");
    expect(p.get("line_items[0][price_data][currency]")).toBe("eur");
  });
});
