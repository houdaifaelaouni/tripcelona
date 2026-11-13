# Stripe payments

Stripe Checkout (hosted page) is one of three gateways. `PAYMENT_PROVIDER=stripe` selects it; refunds always go back through the gateway that took the payment.

## Vercel environment variables

| Variable | Value |
| --- | --- |
| `PAYMENT_PROVIDER` | `stripe` |
| `STRIPE_SECRET_KEY` | `sk_live_…` (or a restricted key with Checkout Sessions: write, Refunds: write) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` of the endpoint below |

The publishable key (`pk_live_…`) is not needed: customers are redirected to Stripe's hosted page.

## Webhook endpoint

In Stripe, Developers > Webhooks > Add endpoint:

- URL: `https://<site>/api/pagos/stripe/webhook`
- Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`

The booking is confirmed by the webhook, never by the customer returning to the success page. Replays are ignored. A payment that arrives after the seats were released, or with a different amount, is refunded automatically.

## Test mode first

Use `sk_test_…` and a test-mode endpoint secret, pay with card `4242 4242 4242 4242` (any future date, any CVC), check the booking turns paid, then refund it from the admin.
