import { createHash } from "node:crypto";

export const E2E = {
  tourSlug: "la-magia-rural-de-cataluna-escapada-a-rupit-y-tavertet",
  departureNote: "e2e departure",
  tourTitleEn: "Rural magic: Rupit and Tavertet (test)",
  ownerEmail: "e2e-owner@example.com",
} as const;

/**
 * Password of the e2e owner on the local stack. Derived from that stack's
 * service role key, so no password is committed and it differs per stack.
 */
export function e2eOwnerPassword(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing: is the local stack running?");
  return `E2e-${createHash("sha256").update(`e2e-owner|${key}`).digest("hex").slice(0, 20)}`;
}
