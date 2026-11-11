"use server";

import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { altSchema as alt, storeImage } from "./media-store";
import { backWith } from "./redirect";

const BACK = "/admin/medios";

/** FR-87: upload, resized like the media pipeline (max 2000 px, WebP). */
export async function uploadMedia(form: FormData) {
  const staff = await assertStaff("any");
  const db = await createClient();
  const stored = await storeImage(db, form.get("file"), form.get("alt"));
  if ("error" in stored) backWith(BACK, { error: stored.error });
  await audit(staff.id, "media.upload", "media", stored.id, { path: stored.path });
  backWith(BACK, { ok: "subido" });
}

export async function updateMediaAlt(id: string, form: FormData) {
  const staff = await assertStaff("any");
  const parsed = alt.safeParse(form.get("alt") ?? "");
  if (!parsed.success) backWith(BACK, { error: parsed.error.issues[0].message });
  const db = await createClient();
  const { error } = await db.from("media").update({ alt: parsed.data }).eq("id", id);
  if (error) backWith(BACK, { error: `No se pudo guardar: ${error.message}` });
  await audit(staff.id, "media.alt", "media", id);
  const q = String(form.get("q") ?? "");
  backWith(q ? `${BACK}?q=${encodeURIComponent(q)}` : BACK, { ok: "guardado" });
}

/** Guarded delete (FR-87): owner only, and never while the image is in use. */
export async function deleteMedia(id: string) {
  const staff = await assertStaff("owner");
  const db = await createClient();
  const { data: usage } = await db.rpc("media_usage", { p_media_id: id });
  if ((usage ?? 0) > 0) {
    backWith(BACK, {
      error: `No se puede borrar: la imagen se usa en ${usage} sitio(s). Quítala primero de ahí.`,
    });
  }
  const { data: row } = await db
    .from("media")
    .select("bucket, path, source_url")
    .eq("id", id)
    .single();
  if (!row) backWith(BACK, { error: "Imagen no encontrada." });
  const { error } = await db.from("media").delete().eq("id", id);
  if (error) {
    backWith(BACK, {
      error: error.message.includes("in use")
        ? "No se puede borrar: la imagen está en uso."
        : `No se pudo borrar: ${error.message}`,
    });
  }
  // Legacy rows may not have a Storage file yet; ignore "not found".
  await db.storage.from(row.bucket).remove([row.path, row.path.replace(/\.webp$/, ".avif")]);
  await audit(staff.id, "media.delete", "media", id, {
    path: row.path,
    source_url: row.source_url,
  });
  backWith(BACK, { ok: "eliminado" });
}
