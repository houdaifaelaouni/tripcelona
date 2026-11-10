import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseUrl } from "./env";

/**
 * Service-role client: BYPASSES RLS. Server-only, for checkout, payment
 * notifications and form submissions after validation. Never import from
 * client code (the "server-only" import enforces this at build time).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing environment variable SUPABASE_SERVICE_ROLE_KEY");
  return createClient<Database>(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
