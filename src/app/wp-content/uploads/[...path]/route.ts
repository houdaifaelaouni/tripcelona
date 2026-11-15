import { createPublicClient } from "@/lib/supabase/public";
import { legacyDownloadUrl } from "@/lib/media/pipeline";
import { supabaseUrl } from "@/lib/supabase/env";

/**
 * Old image URLs (`/wp-content/uploads/...`) may be indexed by Google Images
 * (US-30, US-33). After the cutover they 301 to the copy in Supabase Storage,
 * matched through `media.source_url`. WordPress thumbnail sizes (`-300x200`)
 * resolve to the full image.
 *
 * Files not copied yet (or unknown, like images inside old posts) go to the
 * old WordPress on LEGACY_WP_ORIGIN with a temporary 302 when that is set,
 * otherwise a plain 404.
 */
export async function GET(_req: Request, ctx: RouteContext<"/wp-content/uploads/[...path]">) {
  const { path } = await ctx.params;
  const rel = path.map(encodeURIComponent).join("/");
  const full = rel.replace(/-\d{2,5}x\d{2,5}(?=\.(jpe?g|png|webp|gif|avif)$)/i, "");
  const candidates = [...new Set([rel, full])].flatMap((p) => [
    `https://tripcelona.com/wp-content/uploads/${p}`,
    `https://www.tripcelona.com/wp-content/uploads/${p}`,
  ]);
  const { data } = await createPublicClient()
    .from("media")
    .select("bucket, path, source_url, width")
    .in("source_url", candidates)
    .limit(1)
    .maybeSingle();
  const copied = data && (data.width !== null || process.env.MEDIA_FROM_STORAGE === "true");
  if (!data || !copied) {
    const legacy = process.env.LEGACY_WP_ORIGIN;
    if (legacy)
      return Response.redirect(
        legacyDownloadUrl(`https://tripcelona.com/wp-content/uploads/${rel}`, legacy),
        302,
      );
    return new Response("Not found", { status: 404 });
  }
  return Response.redirect(
    `${supabaseUrl()}/storage/v1/object/public/${data.bucket}/${data.path}`,
    301,
  );
}
