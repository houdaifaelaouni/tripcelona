/**
 * Redirects the owner manages in the admin (table `redirects`), kept in
 * memory by the proxy and refreshed every minute. Fails open: if Supabase
 * cannot be reached, requests are served as usual.
 */
export type RedirectRule = { to: string; status: 301 | 302 | 307 | 308 | 410 };

const TTL_MS = 60_000;
let cache: { rules: Map<string, RedirectRule>; at: number } | null = null;
let pending: Promise<void> | null = null;

async function load(): Promise<Map<string, RedirectRule> | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/redirects?select=from_path,to_path,status_code`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(2_000),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as {
      from_path: string;
      to_path: string;
      status_code: RedirectRule["status"];
    }[];
    return new Map(rows.map((r) => [r.from_path, { to: r.to_path, status: r.status_code }]));
  } catch {
    return null;
  }
}

/** The owner's rule for this path (no trailing slash), or null. */
export async function lookupRedirect(path: string): Promise<RedirectRule | null> {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    pending ??= load()
      .then((rules) => {
        cache = rules ? { rules, at: Date.now() } : null;
      })
      .finally(() => {
        pending = null;
      });
    await pending;
  }
  return cache?.rules.get(path || "/") ?? null;
}
