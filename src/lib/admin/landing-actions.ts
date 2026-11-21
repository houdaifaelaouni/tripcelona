"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { LANDINGS_TAG, slugify } from "@/lib/landings/queries";
import { createClient } from "@/lib/supabase/server";
import { backWith } from "./redirect";

const BACK = "/admin/landings";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  title: z.string().trim().min(3, "El título necesita al menos 3 letras.").max(140),
  slug: z
    .string()
    .trim()
    .max(80)
    .transform((v) => slugify(v)),
  brief: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => v || null),
  tour_id: z
    .string()
    .optional()
    .transform((v) => (v && UUID.test(v) ? v : null)),
});

/** Media buyer: a new landing from a title (slug made from it). Always a draft. */
export async function createLanding(form: FormData) {
  const staff = await assertStaff("any");
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) backWith(BACK, { error: parsed.error.issues[0].message });
  const input = parsed.data;
  const slug = input.slug || slugify(input.title);
  if (!slug) backWith(BACK, { error: "No se ha podido crear la dirección a partir del título." });
  const db = await createClient();
  const { data, error } = await db
    .from("landing_pages")
    .insert({ ...input, slug, created_by: staff.id })
    .select("id")
    .single();
  if (error)
    backWith(BACK, {
      error:
        error.code === "23505"
          ? `Ya existe una landing en /l/${slug}. Cambia la dirección.`
          : error.message,
    });
  await audit(staff.id, "landing.create", "landing_pages", data.id, { slug, title: input.title });
  redirect(`/admin/landings/${data.id}?ok=landing_creada`);
}

export async function updateLanding(form: FormData) {
  const staff = await assertStaff("any");
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) backWith(BACK, { error: "Landing no encontrada." });
  const back = `/admin/landings/${id}`;
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) backWith(back, { error: parsed.error.issues[0].message });
  const status = String(form.get("status") ?? "draft");
  if (!["draft", "published", "archived"].includes(status))
    backWith(back, { error: "Estado no válido." });
  const input = parsed.data;
  const db = await createClient();
  const { error } = await db
    .from("landing_pages")
    .update({
      ...input,
      slug: input.slug || slugify(input.title),
      status: status as "draft" | "published" | "archived",
    })
    .eq("id", id);
  if (error)
    backWith(back, {
      error: error.code === "23505" ? "Esa dirección ya la usa otra landing." : error.message,
    });
  updateTag(LANDINGS_TAG);
  await audit(staff.id, "landing.update", "landing_pages", id, { status });
  backWith(back, {
    ok: status === "published" ? "publicado" : status === "archived" ? "archivado" : "borrador",
  });
}

export async function deleteLanding(form: FormData) {
  const staff = await assertStaff("any");
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) backWith(BACK, { error: "Landing no encontrada." });
  const db = await createClient();
  const { error } = await db.from("landing_pages").delete().eq("id", id);
  if (error) backWith(`/admin/landings/${id}`, { error: error.message });
  updateTag(LANDINGS_TAG);
  await audit(staff.id, "landing.delete", "landing_pages", id);
  backWith(BACK, { ok: "eliminado" });
}
