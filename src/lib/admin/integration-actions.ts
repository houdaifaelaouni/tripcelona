"use server";

import { updateTag } from "next/cache";
import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { encryptValue } from "@/lib/payments/secrets";
import { createAdminClient } from "@/lib/supabase/admin";
import { TRACKING_SETTING, TRACKING_TAG } from "@/lib/tracking/config";
import { INTEGRATION_SECRETS, type IntegrationSecret } from "@/lib/tracking/secrets";
import { TRACKING_KEYS, TRACKING_PATTERNS, trackingFromValue } from "@/lib/tracking/shared";
import { backWith } from "./redirect";

const BACK = "/admin/integraciones";

const LABELS: Record<(typeof TRACKING_KEYS)[number], string> = {
  metaPixelId: "ID del píxel de Meta (solo números)",
  tiktokPixelId: "ID del píxel de TikTok (letras mayúsculas y números)",
  gtmId: "ID de Google Tag Manager (GTM-XXXXXXX)",
  ga4Id: "ID de medición de GA4 (G-XXXXXXX)",
  googleAdsId: "ID de Google Ads (AW-123456789)",
  googleAdsPurchaseLabel: "Etiqueta de conversión de compra de Google Ads",
};

/**
 * Media buyer saves the public pixel ids (settings.tracking, read by the
 * public site) and the server-side API tokens (encrypted, never shown again).
 * Any staff member can do it: this is the media buyer's page.
 */
export async function saveIntegrations(form: FormData) {
  const staff = await assertStaff("any");
  const db = createAdminClient();

  const ids: Record<string, string | null> = {};
  for (const k of TRACKING_KEYS) {
    const v = String(form.get(k) ?? "").trim();
    if (v && !TRACKING_PATTERNS[k].test(v))
      backWith(BACK, { error: `${LABELS[k]}: formato no válido.` });
    ids[k] = v || null;
  }
  const clean = trackingFromValue(ids);
  const { error } = await db
    .from("settings")
    .upsert({ key: TRACKING_SETTING, value: clean, is_public: true }, { onConflict: "key" });
  if (error) backWith(BACK, { error: `No se pudo guardar: ${error.message}` });

  const changes: { name: IntegrationSecret; value: string }[] = [];
  const removals: IntegrationSecret[] = [];
  for (const name of INTEGRATION_SECRETS) {
    if (form.get(`clear_${name}`) === "on") {
      removals.push(name);
      continue;
    }
    const v = String(form.get(name) ?? "").trim();
    if (!v) continue;
    if (v.length > 600 || /\s/.test(v)) backWith(BACK, { error: `${name}: valor no válido.` });
    changes.push({ name, value: v });
  }
  if (changes.length) {
    const { error: e } = await db.from("payment_credentials").upsert(
      changes.map((c) => ({ name: c.name, value: encryptValue(c.value), updated_by: staff.id })),
      { onConflict: "name" },
    );
    if (e) backWith(BACK, { error: `No se pudieron guardar los tokens: ${e.message}` });
  }
  if (removals.length) await db.from("payment_credentials").delete().in("name", removals);

  updateTag(TRACKING_TAG);
  await audit(staff.id, "integrations.save", "settings", null, {
    ids: Object.fromEntries(Object.entries(clean).map(([k, v]) => [k, !!v])),
    tokens_saved: changes.map((c) => c.name),
    tokens_removed: removals,
  });
  backWith(BACK, { ok: "integraciones" });
}
