import { createHmac, timingSafeEqual } from "node:crypto";

/** Stripe over plain HTTPS (no SDK): Checkout Sessions, webhooks, refunds. */
export const STRIPE_BASE_URL = "https://api.stripe.com";

export type StripeCredentials = { secretKey: string; webhookSecret: string };

export { newOrderId } from "./redsys";

/** Form-encoded body for POST /v1/checkout/sessions (one line, card only, EUR). */
export function buildCheckoutSession(payment: {
  order: string;
  amountCents: number;
  description: string;
  email?: string | null;
  okUrl: string;
  koUrl: string;
  expiresAt: number;
}): URLSearchParams {
  const p = new URLSearchParams();
  p.set("mode", "payment");
  p.set("client_reference_id", payment.order);
  p.set("success_url", payment.okUrl);
  p.set("cancel_url", payment.koUrl);
  p.set("locale", "es");
  p.set("expires_at", String(payment.expiresAt));
  p.append("payment_method_types[]", "card");
  p.set("line_items[0][quantity]", "1");
  p.set("line_items[0][price_data][currency]", "eur");
  p.set("line_items[0][price_data][unit_amount]", String(payment.amountCents));
  p.set("line_items[0][price_data][product_data][name]", payment.description.slice(0, 250));
  p.set("metadata[order]", payment.order);
  p.set("payment_intent_data[metadata][order]", payment.order);
  if (payment.email) p.set("customer_email", payment.email);
  return p;
}

export type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

/**
 * Check the Stripe-Signature header (`t=…,v1=…`): HMAC-SHA256 of
 * `${t}.${rawBody}` with the endpoint secret, within a 5 minute tolerance.
 */
export function verifyWebhook(
  secret: string,
  rawBody: string,
  header: string | null,
  now = Date.now(),
): StripeEvent | null {
  if (!header) return null;
  let t = "";
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=");
    if (k === "t") t = v ?? "";
    if (k === "v1" && v) signatures.push(v);
  }
  const ts = Number(t);
  if (!Number.isFinite(ts) || !signatures.length) return null;
  if (Math.abs(now / 1000 - ts) > 300) return null;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const ok = signatures.some((s) => {
    const a = Buffer.from(s, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  });
  if (!ok) return null;
  try {
    return JSON.parse(rawBody) as StripeEvent;
  } catch {
    return null;
  }
}

export type StripeResult = {
  order: string;
  eventKey: string;
  authorized: boolean;
  amountCents: number | null;
  payload: Record<string, string>;
};

/**
 * What a verified event means for a booking. Only a Checkout Session that is
 * actually paid confirms; a failed asynchronous payment fails it. Everything
 * else is ignored (null).
 */
export function interpretEvent(event: StripeEvent): StripeResult | null {
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded" &&
    event.type !== "checkout.session.async_payment_failed"
  )
    return null;
  const s = event.data.object;
  const order = typeof s.client_reference_id === "string" ? s.client_reference_id : "";
  if (!order) return null;
  const failed = event.type === "checkout.session.async_payment_failed";
  const paid = !failed && s.payment_status === "paid";
  if (!failed && !paid) return null; // completed but still waiting for the bank
  const total = typeof s.amount_total === "number" ? s.amount_total : null;
  return {
    order,
    eventKey: event.id,
    authorized: paid,
    amountCents: total,
    payload: {
      session: String(s.id ?? ""),
      payment_intent: typeof s.payment_intent === "string" ? s.payment_intent : "",
      amount_total: total === null ? "" : String(total),
      currency: String(s.currency ?? ""),
    },
  };
}
