import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type Name = "RESEND_API_KEY" | "EMAIL_FROM" | "OWNER_EMAIL" | "CRON_SECRET";
const TTL = 5 * 60_000;
const cache = new Map<Name, { value: string | null; at: number }>();

/**
 * A setting from the Vercel variable of the same name, else from Supabase
 * Vault (public.app_secret, service role only). Cached for five minutes.
 */
export async function appSecret(name: Name): Promise<string | null> {
  const env = process.env[name]?.trim();
  if (env) return env;
  const hit = cache.get(name);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  let value: string | null = null;
  try {
    const { data, error } = await createAdminClient().rpc("app_secret", { p_name: name });
    if (!error && typeof data === "string" && data.trim()) value = data.trim();
  } catch {
    value = null;
  }
  cache.set(name, { value, at: Date.now() });
  return value;
}

/** Resend key and sender; both null means emails are only logged. */
export async function emailConfig() {
  const [apiKey, from] = await Promise.all([appSecret("RESEND_API_KEY"), appSecret("EMAIL_FROM")]);
  return apiKey && from ? { apiKey, from } : null;
}

/** Where owner alerts go: OWNER_EMAIL from Vercel or Vault. */
export const ownerEmail = async () => (await appSecret("OWNER_EMAIL")) ?? undefined;
