import { createPublicClient } from "@/lib/supabase/public";
import { supabaseUrl } from "@/lib/supabase/env";

/**
 * Old image URLs (`/wp-content/uploads/...`) may be indexed by Google Images
 * (US-30, US-33). After the cutover they 301 to the copy in Supabase Storage,
 * matched through `media.source_url`. WordPress thumbnail sizes (`-300x200`)
 * resolve to the full image. Unknown files are a plain 404.
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
    .select("bucket, path, source_url")
    .in("source_url", candidates)
    .limit(1)
    .maybeSingle();
  if (!data) return new Response("Not found", { status: 404 });
  return Response.redirect(
    `${supabaseUrl()}/storage/v1/object/public/${data.bucket}/${data.path}`,
    301,
  );
}
