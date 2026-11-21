import "server-only";
import { cookies, headers } from "next/headers";
import { ATTRIBUTION_COOKIE, CONSENT_COOKIE, parseAttribution, type Attribution } from "./shared";

/** What is stored in bookings.attribution. */
export type BookingAttribution = Attribution & {
  consent?: boolean;
  fbp?: string;
  fbc?: string;
  ttp?: string;
  ip?: string;
  ua?: string;
};

const short = (v: string | undefined, max = 300) => (v ? v.slice(0, max) : undefined);

/**
 * The visitor's source at checkout time, read from their cookies. Browser ids
 * (fbp, ttp), IP and user agent are kept only when they accepted cookies:
 * the Conversions APIs need them to match the purchase to the ad click.
 */
export async function readAttribution(): Promise<BookingAttribution | null> {
  const jar = await cookies();
  const base = parseAttribution(jar.get(ATTRIBUTION_COOKIE)?.value);
  const consent = jar.get(CONSENT_COOKIE)?.value === "granted";
  if (!base && !consent) return null;
  const out: BookingAttribution = { ...(base ?? {}), consent };
  if (consent) {
    const h = await headers();
    out.fbp = short(jar.get("_fbp")?.value);
    out.fbc =
      short(jar.get("_fbc")?.value) ??
      (base?.fbclid
        ? `fb.1.${Date.parse(base.at ?? "") || Date.now()}.${base.fbclid}`.slice(0, 300)
        : undefined);
    out.ttp = short(jar.get("_ttp")?.value);
    out.ip = short(h.get("x-forwarded-for")?.split(",")[0]?.trim(), 64);
    out.ua = short(h.get("user-agent") ?? undefined, 400);
  }
  for (const k of Object.keys(out) as (keyof BookingAttribution)[])
    if (out[k] === undefined) delete out[k];
  return out;
}
