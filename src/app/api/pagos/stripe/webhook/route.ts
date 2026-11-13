import { handleStripeWebhook } from "@/lib/payments/service";

/**
 * Stripe webhook (Developers > Webhooks, event `checkout.session.completed`,
 * plus `checkout.session.async_payment_succeeded/failed`). This, not the
 * customer's browser returning to success_url, confirms a booking (US-20).
 * The signature is checked against the raw body before anything is stored.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const outcome = await handleStripeWebhook(rawBody, request.headers.get("stripe-signature"));
  if (outcome === "invalid_signature" || outcome === "not_configured") {
    console.warn(`[stripe] webhook rejected: ${outcome}`);
    return new Response("Invalid webhook", { status: 400 });
  }
  console.info(`[stripe] webhook ${outcome}`);
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}
