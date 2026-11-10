import { execSync } from "node:child_process";

/** Point server modules at the local Supabase stack (`pnpm supabase start`). */
export function connectLocalSupabase() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const out = execSync("pnpm --silent supabase status -o env", { encoding: "utf8" });
  const get = (k: string) => out.match(new RegExp(`^${k}="?([^"\\n]+)"?`, "m"))?.[1];
  process.env.NEXT_PUBLIC_SUPABASE_URL = get("API_URL");
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = get("ANON_KEY");
  process.env.SUPABASE_SERVICE_ROLE_KEY = get("SERVICE_ROLE_KEY");
}

/** Wait until the REST API answers (it reloads its schema after `db reset`). */
export async function waitForSupabaseApi(timeoutMs = 60_000) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tours?select=id&limit=1`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
      if (res.ok) return;
    } catch {
      // not up yet
    }
    if (Date.now() > deadline) throw new Error("Supabase API did not become ready");
    await new Promise((r) => setTimeout(r, 500));
  }
}
