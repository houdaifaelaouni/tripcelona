"use server";

import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { MAX_EDGE } from "@/lib/media/pipeline";
import { createClient } from "@/lib/supabase/server";
import { backWith } from "./redirect";

const BACK = "/admin/medios";
const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const alt = z
  .string()
  .trim()
  .min(3, "Describe la imagen (texto alternativo, mínimo 3 caracteres).")
  .max(300);

function fileSlug(name: string) {
  return (
    name
      .replace(/\.[a-z0-9]+$/i, "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "imagen"
  );
}

/** FR-87: upload, resized like the media pipeline (max 2000 px, WebP). */
export async function uploadMedia(form: FormData) {
  const staff = await assertStaff("any");
  const file = form.get("file");
  const altText = alt.safeParse(form.get("alt") ?? "");
  if (!(file instanceof File) || file.size === 0) backWith(BACK, { error: "Elige una imagen." });
  if (!altText.success) backWith(BACK, { error: altText.error.issues[0].message });
  if (!TYPES.has(file.type))
    backWith(BACK, { error: "Formato no admitido: usa JPG, PNG, WebP, AVIF o GIF." });
  if (file.size > MAX_BYTES) backWith(BACK, { error: "La imagen pesa más de 10 MB." });

  let out: { data: Buffer; info: { width: number; height: number } };
  try {
    out = await sharp(Buffer.from(await file.arrayBuffer()), { failOn: "error" })
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    backWith(BACK, { error: "No se pudo leer la imagen." });
  }

  const now = new Date();
  const path = `library/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${fileSlug(file.name)}-${randomBytes(3).toString("hex")}.webp`;
  const db = await createClient();
  const { error: upErr } = await db.storage
    .from("media")
    .upload(path, out.data, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (upErr) backWith(BACK, { error: `No se pudo subir: ${upErr.message}` });

  const { data, error } = await db
    .from("media")
    .insert({
      bucket: "media",
      path,
      alt: altText.data,
      mime: "image/webp",
      width: out.info.width,
      height: out.info.height,
      size_bytes: out.data.length,
    })
    .select("id")
    .single();
  if (error) {
    await db.storage.from("media").remove([path]);
    backWith(BACK, { error: `No se pudo registrar: ${error.message}` });
  }
  await audit(staff.id, "media.upload", "media", data.id, { path });
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
