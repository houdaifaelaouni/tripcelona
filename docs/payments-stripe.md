# Stripe payments

Stripe Checkout (hosted page) is one of three gateways. `PAYMENT_PROVIDER=stripe` selects it; refunds always go back through the gateway that took the payment.

## Easiest: save the keys in the admin

Admin > Pagos > "Claves de pago". Paste the keys, press save. They are stored encrypted in `payment_credentials` (run `supabase/migrations/20261113000300_payment_credentials.sql` once in the Supabase SQL editor), never shown again, and override the Vercel variables below. Blank fields keep what is saved. The encryption key comes from `SUPABASE_SERVICE_ROLE_KEY` (or `SETTINGS_ENCRYPTION_KEY` if set): if you rotate the service role key, re-enter the payment keys.

## Vercel environment variables (alternative)

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
