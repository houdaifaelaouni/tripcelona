import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { defaultLocale, localizePath, locales } from "@/lib/i18n/config";
import { siteUrl } from "@/lib/seo/site-url";
import { getPublishedTours } from "@/lib/tours/queries";

// Routes that exist today; /eventos arrives with decision D3.
const STATIC_PATHS = [
  "/",
  "/ofertas-de-viajes",
  "/blog",
  "/preguntas-frecuentes",
  "/contactanos",
  "/crea-tu-tour",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const tours = await getPublishedTours();
  const db = createPublicClient();
  const [{ data: posts }, { data: pages }] = await Promise.all([
    db.from("posts").select("slug, published_at, updated_at").eq("status", "published"),
    db.from("pages").select("slug, updated_at").eq("status", "published"),
  ]);

  const entries: { path: string; lastModified?: string; changeFrequency?: "weekly" }[] = [
    ...STATIC_PATHS.map((path) => ({ path, changeFrequency: "weekly" as const })),
    ...tours.map((t) => ({ path: `/excursiones/${t.slug}`, changeFrequency: "weekly" as const })),
    ...(pages ?? []).map((p) => ({ path: `/${p.slug}`, lastModified: p.updated_at })),
    ...(posts ?? []).map((p) => ({
      path: `/blog/${p.slug}`,
      lastModified: p.updated_at ?? p.published_at ?? undefined,
    })),
  ];
  const abs = (path: string, locale: (typeof locales)[number]) => {
    const href = localizePath(path, locale);
    return `${base}${href === "/" ? "" : href}`;
  };
  // One entry per language, each pointing at all of its translations.
  return entries.flatMap(({ path, ...rest }) =>
    locales.map((locale) => ({
      url: abs(path, locale),
      ...rest,
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((l) => [l, abs(path, l)])),
          "x-default": abs(path, defaultLocale),
        },
      },
    })),
  );
}
