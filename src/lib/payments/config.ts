import "server-only";
import { siteUrl } from "@/lib/seo/site-url";
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

export const paymentUrls = (bookingId: string) => ({
  notificationUrl: `${siteUrl()}/api/pagos/redsys/notificacion`,
  okUrl: `${siteUrl()}/reservar/confirmada?id=${bookingId}`,
  koUrl: `${siteUrl()}/reservar/pendiente?id=${bookingId}&pago=error`,
});
