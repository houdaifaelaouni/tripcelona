"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { safeHref } from "@/lib/content/rich-text";
import { SETTINGS_TAG, SOCIAL_NETWORKS } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { backWith } from "./redirect";

const BACK = "/admin/ajustes";
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .optional()
    .transform((v) => (v ? v : null));
const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s]{9,20}$/, "Teléfono: solo números y espacios, con prefijo (+34 …).");
const https = text(300).refine(
  (v) => v === null || /^https:\/\/\S+$/.test(v),
  "Los enlaces deben empezar por https://",
);

const schema = z.object({
  phone,
  whatsapp: phone,
  email: text(200).refine((v) => v === null || z.email().safeParse(v).success, "Email no válido."),
  meeting_point: z.string().trim().min(5, "Indica el punto de salida.").max(300),
  ...Object.fromEntries(SOCIAL_NETWORKS.map((n) => [`social_${n}`, https])),
  banner_active: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  banner_text: text(200),
  banner_href: text(300).refine(
    (v) => v === null || safeHref(v) !== null,
    "Enlace del aviso no válido.",
  ),
  quote_extras: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 20),
    ),
  quote_note: text(400),
  legal_titular: text(200),
  legal_nif: text(20),
  legal_domicilio: text(300),
});

/** FR-86: owner edits contact data, socials, banner and legal identity. No deploy needed. */
export async function saveSettings(form: FormData) {
  const staff = await assertStaff("owner");
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    backWith(BACK, { error: parsed.error.issues[0]?.message ?? "Revisa el formulario." });
  const d = parsed.data as z.infer<typeof schema> & Record<string, string | null>;
  if (d.banner_active && !d.banner_text)
    backWith(BACK, { error: "Escribe el texto del aviso o desactívalo." });

  const socials = Object.fromEntries(
    SOCIAL_NETWORKS.flatMap((n) => (d[`social_${n}`] ? [[n, d[`social_${n}`]]] : [])),
  );
  const rows = [
    { key: "phone", value: d.phone },
    { key: "whatsapp", value: d.whatsapp },
    { key: "email", value: d.email ?? "" }, // jsonb null would hit NOT NULL
    { key: "meeting_point", value: d.meeting_point },
    { key: "socials", value: socials },
    {
      key: "banner",
      value: { active: d.banner_active, text: d.banner_text ?? "", href: d.banner_href ?? "" },
    },
    { key: "quote_extras", value: d.quote_extras },
    { key: "quote_note", value: d.quote_note ?? "" },
    {
      key: "legal_identity",
      value: { titular: d.legal_titular, nif: d.legal_nif, domicilio: d.legal_domicilio },
    },
  ];
  const db = await createClient();
  const { error } = await db.from("settings").upsert(rows as never, { onConflict: "key" });
  if (error) backWith(BACK, { error: `No se pudo guardar: ${error.message}` });
  await audit(staff.id, "settings.update", "settings", null, { keys: rows.map((r) => r.key) });
  updateTag(SETTINGS_TAG);
  backWith(BACK, { ok: "ajustes" });
}
