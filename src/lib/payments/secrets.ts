import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Payment settings the owner can save from the admin instead of Vercel. They
 * live encrypted in `payment_credentials`; a saved value wins over the Vercel
 * variable of the same name, and with nothing saved the variable is used.
 */
export const PAYMENT_FIELDS = [
  "PAYMENT_PROVIDER",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "PAYCOMET_API_KEY",
  "PAYCOMET_TERMINAL",
  "PAYCOMET_CUSTOMER_CODE",
  "PAYCOMET_PASSWORD",
  "REDSYS_MERCHANT_CODE",
  "REDSYS_TERMINAL",
  "REDSYS_SECRET_KEY",
  "REDSYS_ENV",
] as const;
export type PaymentField = (typeof PAYMENT_FIELDS)[number];

/** Key derived from SETTINGS_ENCRYPTION_KEY, else from the service role key. */
function key(): Buffer {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("No key to encrypt payment settings with");
  return Buffer.from(hkdfSync("sha256", secret, "tripcelona", "payment-credentials-v1", 32));
}

export function encryptValue(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    body.toString("base64"),
  ].join(":");
}

export function decryptValue(stored: string): string | null {
  const [v, iv, tag, body] = stored.split(":");
  if (v !== "v1" || !iv || !tag || !body) return null;
  try {
    const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(body, "base64")), d.final()]).toString("utf8");
  } catch {
    return null; // key changed or row damaged: behave as if not saved
  }
}

/** Saved values only (no env), by name. Empty when the table does not exist yet. */
export async function savedPaymentValues(): Promise<Partial<Record<PaymentField, string>>> {
  try {
    const { data, error } = await createAdminClient()
      .from("payment_credentials")
      .select("name, value");
    if (error || !data) return {};
    const out: Partial<Record<PaymentField, string>> = {};
    for (const row of data) {
      const plain = decryptValue(row.value);
      if (plain && (PAYMENT_FIELDS as readonly string[]).includes(row.name))
        out[row.name as PaymentField] = plain;
    }
    return out;
  } catch {
    return {};
  }
}

export type PaymentEnv = Record<PaymentField, string | undefined>;

/** Each setting: saved in the admin, else the Vercel variable, else undefined. */
export async function paymentEnv(): Promise<PaymentEnv> {
  const saved = await savedPaymentValues();
  return Object.fromEntries(
    PAYMENT_FIELDS.map((f) => [f, saved[f] || process.env[f] || undefined]),
  ) as PaymentEnv;
}
