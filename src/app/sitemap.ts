import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { siteUrl } from "@/lib/seo/site-url";
import { getPublishedTours } from "@/lib/tours/queries";

// Only routes that exist today; later sprints add theirs (blog, eventos, legal...).
const STATIC_PATHS = ["/", "/ofertas-de-viajes"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const tours = await getPublishedTours();
  const { data: posts } = await createPublicClient()
    .from("posts")
    .select("slug, published_at, updated_at")
    .eq("status", "published");

  return [
    ...STATIC_PATHS.map((path) => ({
      url: `${base}${path === "/" ? "" : path}`,
      changeFrequency: "weekly" as const,
    })),
    ...tours.map((t) => ({
      url: `${base}/excursiones/${t.slug}`,
      changeFrequency: "weekly" as const,
    })),
    ...(posts ?? []).map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updated_at ?? p.published_at ?? undefined,
    })),
  ];
}
