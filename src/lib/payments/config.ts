import { localizePath, type Locale } from "@/lib/i18n/config";
import "server-only";
import { siteUrl } from "@/lib/seo/site-url";
import { PAYCOMET_BASE_URL, type PaycometCredentials } from "./paycomet";
import { STRIPE_BASE_URL, type StripeCredentials } from "./stripe";
import { REDSYS_URLS, type RedsysCredentials } from "./redsys";

export type RedsysConfig = RedsysCredentials & {
  redirectUrl: string;
  restUrl: string;
};

/**
 * Redsys settings from env (Vercel). Returns null when payment is not
 * configured, so the site falls back to WhatsApp instead of crashing.
 * REDSYS_BASE_URL only exists to point local end-to-end checks at a fake
 * gateway; it is ignored in production builds.
 */
export function redsysConfig(): RedsysConfig | null {
  const merchantCode = process.env.REDSYS_MERCHANT_CODE;
  const terminal = process.env.REDSYS_TERMINAL;
  const secretKey = process.env.REDSYS_SECRET_KEY;
  if (!merchantCode || !terminal || !secretKey) return null;

  const urls = process.env.REDSYS_ENV === "live" ? REDSYS_URLS.live : REDSYS_URLS.test;
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
 * PAYCOMET settings from env (Vercel). Null when not configured. The
 * terminal number picks sandbox or live. PAYCOMET_BASE_URL only exists to
 * point local end-to-end checks at a fake gateway; it is ignored in
 * production builds.
 */
export function paycometConfig(): PaycometConfig | null {
  const apiKey = process.env.PAYCOMET_API_KEY;
  const terminal = process.env.PAYCOMET_TERMINAL;
  const customerCode = process.env.PAYCOMET_CUSTOMER_CODE;
  const password = process.env.PAYCOMET_PASSWORD;
  if (!apiKey || !terminal || !customerCode || !password) return null;
  const override =
    process.env.VERCEL_ENV !== "production"
      ? process.env.PAYCOMET_BASE_URL?.replace(/\/$/, "")
      : "";
  return { apiKey, terminal, customerCode, password, baseUrl: override || PAYCOMET_BASE_URL };
}

export type StripeConfig = StripeCredentials & { baseUrl: string };

/** A readable reason when STRIPE_SECRET_KEY is the wrong kind of key, else null. */
export function stripeKeyProblem(key = process.env.STRIPE_SECRET_KEY): string | null {
  if (!key) return null;
  if (key.startsWith("pk_"))
    return "STRIPE_SECRET_KEY contiene la clave pública (pk_…). Pon la clave secreta (sk_… o rk_…).";
  if (!/^(sk|rk)_(live|test)_/.test(key))
    return "STRIPE_SECRET_KEY no parece una clave secreta de Stripe (sk_live_… o rk_live_…).";
  return null;
}

/** Stripe settings from env (Vercel). Null when the secret key or webhook secret is missing. */
export function stripeConfig(): StripeConfig | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) return null;
  if (stripeKeyProblem()) return null;
  const override =
    process.env.VERCEL_ENV !== "production" ? process.env.STRIPE_BASE_URL?.replace(/\/$/, "") : "";
  return { secretKey, webhookSecret, baseUrl: override || STRIPE_BASE_URL };
}

export type PaymentProvider = "redsys" | "paycomet" | "stripe";

/**
 * Which gateway takes new card payments. PAYMENT_PROVIDER picks it (default
 * redsys, so nothing changes until it is set to "paycomet" or "stripe"); null when the
 * chosen one is not configured. Refunds always go to the gateway that took
 * the payment, whatever this says.
 */
export function activeProvider(): PaymentProvider | null {
  const wanted = ["paycomet", "stripe"].includes(process.env.PAYMENT_PROVIDER ?? "")
    ? process.env.PAYMENT_PROVIDER
    : "redsys";
  if (wanted === "stripe") return stripeConfig() ? "stripe" : null;
  if (wanted === "paycomet") return paycometConfig() ? "paycomet" : null;
  return redsysConfig() ? "redsys" : null;
}

/** Return pages keep the customer in the language they paid in. */
export const paymentUrls = (bookingId: string, locale: Locale = "es") => ({
  notificationUrl: `${siteUrl()}/api/pagos/redsys/notificacion`,
  okUrl: `${siteUrl()}${localizePath("/reservar/confirmada", locale)}?id=${bookingId}`,
  koUrl: `${siteUrl()}${localizePath("/reservar/pendiente", locale)}?id=${bookingId}&pago=error`,
});
