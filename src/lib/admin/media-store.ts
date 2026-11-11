import "server-only";

import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { MAX_EDGE } from "@/lib/media/pipeline";
import type { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
export const altSchema = z
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

type Db = Awaited<ReturnType<typeof createClient>>;
export type Stored = { id: string; path: string } | { error: string };

/**
 * FR-87: validate an uploaded image, resize it like the media pipeline
 * (max 2000 px, WebP), put it in Storage and add it to the media library.
 */
export async function storeImage(db: Db, file: unknown, rawAlt: unknown): Promise<Stored> {
  const altText = altSchema.safeParse(rawAlt ?? "");
  if (!(file instanceof File) || file.size === 0) return { error: "Elige una imagen." };
  if (!altText.success) return { error: altText.error.issues[0].message };
  if (!TYPES.has(file.type))
    return { error: "Formato no admitido: usa JPG, PNG, WebP, AVIF o GIF." };
  if (file.size > MAX_BYTES) return { error: "La imagen pesa más de 10 MB." };

  let out: { data: Buffer; info: { width: number; height: number } };
  try {
    out = await sharp(Buffer.from(await file.arrayBuffer()), { failOn: "error" })
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    return { error: "No se pudo leer la imagen." };
  }

  const now = new Date();
  const path = `library/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${fileSlug(file.name)}-${randomBytes(3).toString("hex")}.webp`;
  const { error: upErr } = await db.storage
    .from("media")
    .upload(path, out.data, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (upErr) return { error: `No se pudo subir: ${upErr.message}` };

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
    return { error: `No se pudo registrar: ${error.message}` };
  }
  return { id: data.id, path };
}
