import { targetPaths } from "@/lib/media/pipeline";
import { supabaseUrl } from "@/lib/supabase/env";

const LEGACY_UPLOADS = /^https:\/\/tripcelona\.com\/wp-content\/uploads\//;

/** Storage path the importer registers for a legacy content image. */
export function contentMediaPath(legacyUrl: string): string {
  const name = decodeURIComponent(new URL(legacyUrl).pathname.split("/").pop() ?? "image");
  return `content/${name}`;
}

export function isLegacyUpload(url: string): boolean {
  return LEGACY_UPLOADS.test(url);
}

/**
 * Imported posts keep legacy WordPress image URLs in their JSON. Once
 * `pnpm media:sync` has copied them (MEDIA_FROM_STORAGE=true), serve the
 * Storage copy at its stable path instead.
 */
export function resolveContentImage(src: string): string {
  if (process.env.MEDIA_FROM_STORAGE !== "true" || !isLegacyUpload(src)) return src;
  const { webp } = targetPaths(contentMediaPath(src));
  return `${supabaseUrl()}/storage/v1/object/public/media/${webp}`;
}
