import { supabaseUrl } from "@/lib/supabase/env";

type MediaRow = { bucket: string; path: string; source_url: string | null } | null;

/**
 * Public URL for a media row.
 *
 * TEMPORARY (until the Sprint 7 media pipeline, US-30): images have not been
 * copied into Supabase Storage yet, so we serve the legacy WordPress URL
 * recorded in `media.source_url`. Once a file is in Storage, `source_url`
 * stays for traceability but the Storage URL wins via MEDIA_FROM_STORAGE.
 */
export function mediaUrl(media: MediaRow): string | null {
  if (!media) return null;
  // Photos shipped with the site itself (public/photos/...) are always served locally.
  if (media.source_url?.startsWith("/")) return media.source_url;
  if (process.env.MEDIA_FROM_STORAGE !== "true" && media.source_url) return media.source_url;
  return `${supabaseUrl()}/storage/v1/object/public/${media.bucket}/${media.path}`;
}
