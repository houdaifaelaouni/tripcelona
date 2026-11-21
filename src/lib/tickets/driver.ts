import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { siteUrl } from "@/lib/seo/site-url";

/*
 * Driver boarding links: one secret link per departure, no login. The key is
 * an HMAC of the departure id, so a link only opens its own departure and
 * cannot be guessed. Set DRIVER_LINK_SECRET to rotate every link at once.
 */

function secret(): string {
  const s = process.env.DRIVER_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("DRIVER_LINK_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is not set");
  return s;
}

export function driverKey(departureId: string): string {
  return createHmac("sha256", secret())
    .update(`driver:${departureId}`)
    .digest("base64url")
    .slice(0, 24);
}

export function isDriverKey(departureId: string, key: string): boolean {
  const expected = Buffer.from(driverKey(departureId));
  const given = Buffer.from(key);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export const driverUrl = (departureId: string) =>
  `${siteUrl()}/conductor/${departureId}?k=${driverKey(departureId)}`;

/** The booking reference inside a scanned QR (check-in URL or plain text). */
export function referenceFromScan(text: string): string | null {
  let raw = text;
  try {
    raw = decodeURIComponent(text);
  } catch {
    // keep the raw text
  }
  const m = /TC-\d{4}-\d{3,8}/i.exec(raw);
  return m ? m[0].toUpperCase() : null;
}
