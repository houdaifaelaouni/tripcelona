/** Every run starts with empty form rate limits (5 per 10 min per client). */
export default async function globalSetup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing: is the local stack running?");
  const res = await fetch(`${url}/rest/v1/form_rate_limits?key=neq.`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Could not reset rate limits: ${res.status}`);
}
