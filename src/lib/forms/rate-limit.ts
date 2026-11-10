import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/** Per-form limits: hits per window, per client (FR-41). */
export const LIMITS = {
  contact: { limit: 5, windowSeconds: 600 },
  quote: { limit: 5, windowSeconds: 600 },
  // Booking lookup: enough for typos, too few to guess references.
  lookup: { limit: 10, windowSeconds: 600 },
} as const;

/** Client key: hash of form + IP (+ user agent), so no raw IP is stored. */
export async function clientKey(form: keyof typeof LIMITS): Promise<string> {
  const h = await headers();
  const ip =
    (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const salt = process.env.RATE_LIMIT_SALT ?? "tripcelona";
  return createHash("sha256").update(`${form}|${ip}|${salt}`).digest("hex").slice(0, 32);
}

/**
 * True when the request is allowed. Fails open if the database is unreachable,
 * because the insert that follows would fail anyway and say so.
 */
export async function allowSubmission(form: keyof typeof LIMITS): Promise<boolean> {
  const { limit, windowSeconds } = LIMITS[form];
  const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
    p_key: await clientKey(form),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit]", error.message);
    return true;
  }
  return data === true;
}
