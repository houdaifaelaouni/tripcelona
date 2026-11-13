"use server";

import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { stripeKeyProblem } from "@/lib/payments/config";
import { encryptValue, PAYMENT_FIELDS, type PaymentField } from "@/lib/payments/secrets";
import { createAdminClient } from "@/lib/supabase/admin";
import { backWith } from "./redirect";

const BACK = "/admin/pagos";

/** "Remove saved keys" clears a whole gateway at once. */
const GROUPS: Record<string, PaymentField[]> = {
  stripe: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  paycomet: [
    "PAYCOMET_API_KEY",
    "PAYCOMET_TERMINAL",
    "PAYCOMET_CUSTOMER_CODE",
    "PAYCOMET_PASSWORD",
  ],
  redsys: ["REDSYS_MERCHANT_CODE", "REDSYS_TERMINAL", "REDSYS_SECRET_KEY", "REDSYS_ENV"],
};

/** Per field: how it is checked. Anything not listed only needs to be non-empty text. */
const CHECKS: Partial<Record<PaymentField, (v: string) => string | null>> = {
  PAYMENT_PROVIDER: (v) =>
    ["stripe", "paycomet", "redsys"].includes(v) ? null : "Elige Stripe, PAYCOMET o Redsys.",
  STRIPE_SECRET_KEY: (v) => stripeKeyProblem(v),
  STRIPE_WEBHOOK_SECRET: (v) =>
    v.startsWith("whsec_") ? null : "El secreto del webhook de Stripe empieza por whsec_.",
  REDSYS_ENV: (v) => (["live", "test"].includes(v) ? null : "Redsys: elige real o pruebas."),
  PAYCOMET_TERMINAL: (v) =>
    /^\d{3,12}$/.test(v) ? null : "El terminal PAYCOMET son solo números.",
};

/**
 * Owner saves gateway keys from the admin. A blank field keeps what is saved;
 * "remove" clears a saved value (the Vercel variable, if any, applies again).
 * Values are encrypted before they reach the database and never shown again.
 */
export async function savePaymentCredentials(form: FormData) {
  const staff = await assertStaff("owner");
  const db = createAdminClient();

  const changes: { name: PaymentField; value: string }[] = [];
  const removals: PaymentField[] = [];
  for (const group of Object.keys(GROUPS)) {
    if (form.get(`clear_${group}`) === "on") removals.push(...GROUPS[group]);
  }
  for (const name of PAYMENT_FIELDS) {
    if (removals.includes(name)) continue;
    const raw = form.get(name);
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) continue;
    if (value.length > 500) backWith(BACK, { error: `${name}: valor demasiado largo.` });
    const problem = CHECKS[name]?.(value);
    if (problem) backWith(BACK, { error: problem });
    changes.push({ name, value });
  }
  if (!changes.length && !removals.length)
    backWith(BACK, { error: "No has escrito ninguna clave nueva." });

  if (changes.length) {
    const { error } = await db.from("payment_credentials").upsert(
      changes.map((c) => ({ name: c.name, value: encryptValue(c.value), updated_by: staff.id })),
      { onConflict: "name" },
    );
    if (error) {
      // Table missing = the migration was not run yet.
      const hint = error.message.includes("payment_credentials")
        ? " Falta ejecutar la migración 20261113000300_payment_credentials.sql en Supabase."
        : "";
      backWith(BACK, { error: `No se pudo guardar: ${error.message}.${hint}` });
    }
  }
  if (removals.length) {
    const { error } = await db.from("payment_credentials").delete().in("name", removals);
    if (error) backWith(BACK, { error: `No se pudo quitar: ${error.message}` });
  }
  // Names only, never values.
  await audit(staff.id, "payments.credentials", "payment_credentials", null, {
    saved: changes.map((c) => c.name),
    removed: removals,
  });
  backWith(BACK, { ok: "claves" });
}
