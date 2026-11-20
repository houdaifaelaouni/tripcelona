import { localizePath, type Locale } from "@/lib/i18n/config";
import "server-only";
import { siteUrl } from "@/lib/seo/site-url";
import { PAYCOMET_BASE_URL, type PaycometCredentials } from "./paycomet";
import { STRIPE_BASE_URL, type StripeCredentials } from "./stripe";
import { paymentEnv, type PaymentEnv } from "./secrets";
import { REDSYS_URLS, type RedsysCredentials } from "./redsys";

export type RedsysConfig = RedsysCredentials & {
  redirectUrl: string;
  restUrl: string;
};

/**
 * Redsys settings (saved in the admin or Vercel env). Returns null when payment is not
 * configured, so the site falls back to WhatsApp instead of crashing.
 * REDSYS_BASE_URL only exists to point local end-to-end checks at a fake
 * gateway; it is ignored in production builds.
 */
export async function redsysConfig(env?: PaymentEnv): Promise<RedsysConfig | null> {
  const e = env ?? (await paymentEnv());
  const merchantCode = e.REDSYS_MERCHANT_CODE;
  const terminal = e.REDSYS_TERMINAL;
  const secretKey = e.REDSYS_SECRET_KEY;
  if (!merchantCode || !terminal || !secretKey) return null;

  const urls = e.REDSYS_ENV === "live" ? REDSYS_URLS.live : REDSYS_URLS.test;
  const override =
    process.env.VERCEL_ENV !== "production" ? process.env.REDSYS_BASE_URL?.replace(/\/$/, "") : "";
  return {
    merchantCode,
    terminal,
    secretKey,
    redirectUrl: override ? `${override}/sis/realizarPago` : urls.redirect,
    restUrl: override ? `${override}/sis/rest/trataPeticionREST` : urls.rest,
  };
}

export type PaycometConfig = PaycometCredentials & { baseUrl: string };

/**
 * PAYCOMET settings (saved in the admin or Vercel env). Null when not configured. The
 * terminal number picks sandbox or live. PAYCOMET_BASE_URL only exists to
 * point local end-to-end checks at a fake gateway; it is ignored in
 * production builds.
 */
export async function paycometConfig(env?: PaymentEnv): Promise<PaycometConfig | null> {
  const e = env ?? (await paymentEnv());
  const apiKey = e.PAYCOMET_API_KEY;
  const terminal = e.PAYCOMET_TERMINAL;
  const customerCode = e.PAYCOMET_CUSTOMER_CODE;
  const password = e.PAYCOMET_PASSWORD;
  if (!apiKey || !terminal || !customerCode || !password) return null;
  const override =
    process.env.VERCEL_ENV !== "production"
      ? process.env.PAYCOMET_BASE_URL?.replace(/\/$/, "")
      : "";
  return { apiKey, terminal, customerCode, password, baseUrl: override || PAYCOMET_BASE_URL };
}

export type StripeConfig = StripeCredentials & { baseUrl: string };

/** A readable reason when STRIPE_SECRET_KEY is the wrong kind of key, else null. */
export function stripeKeyProblem(key: string | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("pk_"))
    return "La clave de Stripe contiene la clave pública (pk_…). Pon la clave secreta (sk_… o rk_…).";
  if (!/^(sk|rk)_(live|test)_/.test(key))
    return "La clave de Stripe no parece una clave secreta de Stripe (sk_live_… o rk_live_…).";
  return null;
}

/** Stripe settings (saved in the admin or Vercel env). Null when the secret key or webhook secret is missing. */
export async function stripeConfig(env?: PaymentEnv): Promise<StripeConfig | null> {
  const e = env ?? (await paymentEnv());
  const secretKey = e.STRIPE_SECRET_KEY;
  const webhookSecret = e.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) return null;
  if (stripeKeyProblem(secretKey)) return null;
  const override =
    process.env.VERCEL_ENV !== "production" ? process.env.STRIPE_BASE_URL?.replace(/\/$/, "") : "";
  return { secretKey, webhookSecret, baseUrl: override || STRIPE_BASE_URL };
}

export type PaymentProvider = "redsys" | "paycomet" | "stripe";

/**
 * Which gateway takes new card payments. The payment provider setting picks it (default
 * redsys, so nothing changes until it is set to "paycomet" or "stripe"); null when the
 * chosen one is not configured. Refunds always go to the gateway that took
 * the payment, whatever this says.
 */
export async function activeProvider(env?: PaymentEnv): Promise<PaymentProvider | null> {
  const e = env ?? (await paymentEnv());
  if (e.PAYMENT_PROVIDER === "both") return (await availableProviders(e))[0] ?? null;
  const wanted = ["paycomet", "stripe"].includes(e.PAYMENT_PROVIDER ?? "")
    ? e.PAYMENT_PROVIDER
    : "redsys";
  if (wanted === "stripe") return (await stripeConfig(e)) ? "stripe" : null;
  if (wanted === "paycomet") return (await paycometConfig(e)) ? "paycomet" : null;
  return (await redsysConfig(e)) ? "redsys" : null;
}

/**
 * Gateways the customer may pick from. With PAYMENT_PROVIDER=both that is every
 * configured one of Stripe and PAYCOMET (Stripe first); otherwise just the
 * single active gateway.
 */
export async function availableProviders(env?: PaymentEnv): Promise<PaymentProvider[]> {
  const e = env ?? (await paymentEnv());
  if (e.PAYMENT_PROVIDER === "both") {
    const list: PaymentProvider[] = [];
    if (await stripeConfig(e)) list.push("stripe");
    if (await paycometConfig(e)) list.push("paycomet");
    return list;
  }
  const one = await activeProvider(e);
  return one ? [one] : [];
}

/** What the checkout shows: one gateway, "choice" when the customer picks, or null. */
export async function checkoutGateway(
  env?: PaymentEnv,
): Promise<PaymentProvider | "choice" | null> {
  const list = await availableProviders(env);
  return list.length > 1 ? "choice" : (list[0] ?? null);
}

/** Return pages keep the customer in the language they paid in. */
export const paymentUrls = (bookingId: string, locale: Locale = "es") => ({
  notificationUrl: `${siteUrl()}/api/pagos/redsys/notificacion`,
  okUrl: `${siteUrl()}${localizePath("/reservar/confirmada", locale)}?id=${bookingId}`,
  koUrl: `${siteUrl()}${localizePath("/reservar/pendiente", locale)}?id=${bookingId}&pago=error`,
});
