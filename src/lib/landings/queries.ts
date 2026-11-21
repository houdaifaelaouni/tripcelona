import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";

export const LANDINGS_TAG = "landings";

export function slugify(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export type Landing = {
  id: string;
  slug: string;
  title: string;
  brief: string | null;
  status: "draft" | "published" | "archived";
  tourSlug: string | null;
};

type Row = {
  id: string;
  slug: string;
  title: string;
  brief: string | null;
  status: Landing["status"];
  tours: { slug: string } | null;
};
const toLanding = (r: Row): Landing => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  brief: r.brief,
  status: r.status,
  tourSlug: r.tours?.slug ?? null,
});

/** A published landing page, cached; refreshed when one is saved. */
export async function getPublishedLanding(slug: string): Promise<Landing | null> {
  "use cache";
  cacheTag(LANDINGS_TAG);
  cacheLife("hours");
  const { data } = await createPublicClient()
    .from("landing_pages")
    .select("id, slug, title, brief, status, tours(slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data ? toLanding(data as Row) : null;
}

/** Draft preview: the unguessable id in ?vista= unlocks an unpublished page. */
export async function getLandingPreview(slug: string, id: string): Promise<Landing | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await createAdminClient()
    .from("landing_pages")
    .select("id, slug, title, brief, status, tours(slug)")
    .eq("slug", slug)
    .eq("id", id)
    .maybeSingle();
  return data ? toLanding(data as Row) : null;
}
