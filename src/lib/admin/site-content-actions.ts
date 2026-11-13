"use server";

import { updateTag } from "next/cache";
import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { SETTINGS_TAG } from "@/lib/settings";
import { CONTENT_KEYS } from "@/lib/site-content";
import {
  HOME_LIMITS,
  parseFooter,
  parseList,
  parseNav,
  parsePairs,
} from "@/lib/site-content-shared";
import { createClient } from "@/lib/supabase/server";
import { backWith } from "./redirect";

const field = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

async function store(
  staffId: string,
  back: string,
  rows: { key: string; value: unknown }[],
  action: string,
) {
  const db = await createClient();
  const { error } = await db
    .from("settings")
    .upsert(rows.map((r) => ({ ...r, is_public: true })) as never, { onConflict: "key" });
  if (error) backWith(back, { error: `No se pudo guardar: ${error.message}` });
  await audit(staffId, action, "settings", null, { keys: rows.map((r) => r.key) });
  updateTag(SETTINGS_TAG);
}

async function restore(staffId: string, back: string, keys: string[], action: string) {
  const db = await createClient();
  const { error } = await db.from("settings").delete().in("key", keys);
  if (error) backWith(back, { error: `No se pudo restaurar: ${error.message}` });
  await audit(staffId, action, "settings", null, { keys });
  updateTag(SETTINGS_TAG);
  backWith(back, { ok: "restaurado" });
}

const HOME = "/admin/inicio";

export async function saveHomeContent(formData: FormData) {
  const staff = await assertStaff("any");
  const heroTitle = field(formData, "heroTitle");
  const heroLead = field(formData, "heroLead");
  const whyTitle = field(formData, "whyTitle");
  const stepsTitle = field(formData, "stepsTitle");
  const groupsTitle = field(formData, "groupsTitle");
  const seoTitle = field(formData, "seoTitle");
  const seoDescription = field(formData, "seoDescription");
  for (const [v, name, max] of [
    [heroTitle, "El título principal", 100],
    [heroLead, "El texto de portada", 320],
    [whyTitle, "El título de «Por qué»", 120],
    [stepsTitle, "El título de «Cómo funciona»", 100],
    [groupsTitle, "El título de grupos", 100],
    [seoTitle, "El título para Google", 70],
    [seoDescription, "La descripción para Google", 170],
  ] as const) {
    if (!v) backWith(HOME, { error: `${name} no puede quedar vacío.` });
    if (v.length > max) backWith(HOME, { error: `${name}: máximo ${max} caracteres.` });
  }
  const reasons = parsePairs(field(formData, "reasons"), "Motivos", HOME_LIMITS.reasons);
  if (!reasons.ok) backWith(HOME, { error: reasons.error });
  const steps = parsePairs(field(formData, "steps"), "Pasos", HOME_LIMITS.steps);
  if (!steps.ok) backWith(HOME, { error: steps.error });
  const points = parseList(
    field(formData, "groupPoints"),
    "Puntos de grupos",
    HOME_LIMITS.groupPoints,
  );
  if (!points.ok) backWith(HOME, { error: points.error });

  await store(
    staff.id,
    HOME,
    [
      {
        key: CONTENT_KEYS.home,
        value: {
          heroTitle,
          heroLead,
          whyTitle,
          reasons: reasons.value,
          stepsTitle,
          steps: steps.value,
          groupsTitle,
          groupPoints: points.value,
          seoTitle,
          seoDescription,
        },
      },
    ],
    "content.home.update",
  );
  backWith(HOME, { ok: "guardado" });
}

export async function resetHomeContent() {
  const staff = await assertStaff("any");
  await restore(staff.id, HOME, [CONTENT_KEYS.home], "content.home.reset");
}

const NAV = "/admin/navegacion";

export async function saveNavigation(formData: FormData) {
  const staff = await assertStaff("any");
  const nav = parseNav(field(formData, "nav"));
  if (!nav.ok) backWith(NAV, { error: nav.error });
  const footer = parseFooter(field(formData, "footer"));
  if (!footer.ok) backWith(NAV, { error: footer.error });
  await store(
    staff.id,
    NAV,
    [
      { key: CONTENT_KEYS.nav, value: nav.value },
      { key: CONTENT_KEYS.footer, value: footer.value },
    ],
    "content.nav.update",
  );
  backWith(NAV, { ok: "guardado" });
}

export async function resetNavigation() {
  const staff = await assertStaff("any");
  await restore(staff.id, NAV, [CONTENT_KEYS.nav, CONTENT_KEYS.footer], "content.nav.reset");
}
