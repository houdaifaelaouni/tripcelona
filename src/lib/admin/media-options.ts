import "server-only";
import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/tours/media";

export type MediaOption = { id: string; url: string; alt: string; label: string };

/** Recent media for pickers (cover select, editor image insert). */
export async function mediaOptions(limit = 300): Promise<MediaOption[]> {
  const db = await createClient();
  const { data } = await db
    .from("media")
    .select("id, bucket, path, source_url, alt")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).flatMap((m) => {
    const url = mediaUrl(m);
    if (!url) return [];
    const name = m.path.split("/").pop() ?? m.path;
    return [{ id: m.id, url, alt: m.alt ?? "", label: m.alt ? `${m.alt} (${name})` : name }];
  });
}
