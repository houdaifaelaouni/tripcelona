import type { SlugKind } from "./legacy";

/**
 * Published slugs, kept in memory by the proxy so an unknown slug gets a real
 * 404 status. Refreshed every minute, and at most every 5 s when a slug is
 * missing (so a post published a moment ago is found at once). Fails open:
 * if Supabase cannot be reached the page renders and decides itself.
 */
const TABLE: Record<SlugKind, string> = { post: "posts", page: "pages", tour: "tours" };
const TTL_MS = 60_000;
const MISS_REFRESH_MS = 5_000;

type Entry = { slugs: Set<string>; at: number; pending?: Promise<void> };
const cache = new Map<SlugKind, Entry>();

async function load(kind: SlugKind): Promise<Set<string> | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${TABLE[kind]}?select=slug&status=eq.published`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(2_000),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { slug: string }[];
    return new Set(rows.map((r) => r.slug));
  } catch {
    return null;
  }
}

async function refresh(kind: SlugKind) {
  const entry = cache.get(kind);
  if (entry?.pending) return entry.pending;
  const pending = load(kind).then((slugs) => {
    if (slugs) cache.set(kind, { slugs, at: Date.now() });
    else cache.delete(kind);
  });
  cache.set(kind, { slugs: entry?.slugs ?? new Set(), at: entry?.at ?? 0, pending });
  return pending;
}

/** false only when we know the slug is not published. */
export async function slugExists(kind: SlugKind, slug: string): Promise<boolean> {
  let entry = cache.get(kind);
  if (!entry || entry.pending || Date.now() - entry.at > TTL_MS) {
    await refresh(kind);
    entry = cache.get(kind);
  } else if (!entry.slugs.has(slug) && Date.now() - entry.at > MISS_REFRESH_MS) {
    await refresh(kind);
    entry = cache.get(kind);
  }
  if (!entry || entry.at === 0) return true; // unknown state: fail open
  return entry.slugs.has(slug);
}
