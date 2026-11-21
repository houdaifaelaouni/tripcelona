import "server-only";
import { decryptValue } from "@/lib/payments/secrets";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-side tokens for the Conversions APIs. Saved encrypted from Admin >
 * Integraciones (same encrypted table as the payment keys, never readable by
 * the browser or the admin session). A Vercel variable of the same name is
 * the fallback.
 */
export const INTEGRATION_SECRETS = [
  "META_CAPI_TOKEN",
  "META_TEST_EVENT_CODE",
  "TIKTOK_EVENTS_TOKEN",
  "TIKTOK_TEST_EVENT_CODE",
] as const;
export type IntegrationSecret = (typeof INTEGRATION_SECRETS)[number];

/** Saved values only (no env). Empty when nothing is saved or the table is missing. */
export async function savedIntegrationSecrets(): Promise<
  Partial<Record<IntegrationSecret, string>>
> {
  try {
    const { data, error } = await createAdminClient()
      .from("payment_credentials")
      .select("name, value")
      .in("name", [...INTEGRATION_SECRETS]);
    if (error || !data) return {};
    const out: Partial<Record<IntegrationSecret, string>> = {};
    for (const row of data) {
      const plain = decryptValue(row.value);
      if (plain) out[row.name as IntegrationSecret] = plain;
    }
    return out;
  } catch {
    return {};
  }
}

export async function integrationSecrets(): Promise<Record<IntegrationSecret, string | undefined>> {
  const saved = await savedIntegrationSecrets();
  return Object.fromEntries(
    INTEGRATION_SECRETS.map((k) => [k, saved[k] || process.env[k] || undefined]),
  ) as Record<IntegrationSecret, string | undefined>;
}
