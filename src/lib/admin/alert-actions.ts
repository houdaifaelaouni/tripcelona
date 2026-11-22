"use server";

import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { ALERT_RULES_SETTING, rulesFromValue } from "@/lib/ops/alert-rules";
import { createAdminClient } from "@/lib/supabase/admin";
import { backWith } from "./redirect";

const BACK = "/admin/avisos";

/** Owner saves the four alert rules (sent by the editor as JSON). */
export async function saveAlertRules(form: FormData) {
  const staff = await assertStaff("owner");
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(form.get("rules") ?? ""));
  } catch {
    backWith(BACK, { error: "No se pudieron leer los avisos. Vuelve a intentarlo." });
  }
  const rules = rulesFromValue({ rules: parsed });
  const { error } = await createAdminClient()
    .from("settings")
    .upsert(
      { key: ALERT_RULES_SETTING, value: { rules }, is_public: false },
      { onConflict: "key" },
    );
  if (error) backWith(BACK, { error: `No se pudo guardar: ${error.message}` });
  await audit(staff.id, "alerts.save", "settings", null, { rules });
  backWith(BACK, { ok: "avisos" });
}
