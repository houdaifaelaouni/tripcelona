// The owner's redirects are read through the anon key by the proxy.
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { connectLocalSupabase, waitForSupabaseApi } from "./local-env";

connectLocalSupabase();
await waitForSupabaseApi();

const { createAdminClient } = await import("@/lib/supabase/admin");
const { lookupRedirect } = await import("@/lib/seo/redirect-registry");

const db = createAdminClient();
const from = `/prueba-${randomUUID().slice(0, 8)}`;
const gone = `/borrada-${randomUUID().slice(0, 8)}`;

afterAll(async () => {
  await db.from("redirects").delete().in("from_path", [from, gone]);
});

describe("redirect registry", () => {
  it("finds the owner's rules and ignores unknown paths", async () => {
    await db.from("redirects").insert([
      { from_path: from, to_path: "/blog", status_code: 301 },
      { from_path: gone, to_path: "", status_code: 410 },
    ]);
    expect(await lookupRedirect(from)).toEqual({ to: "/blog", status: 301 });
    expect(await lookupRedirect(gone)).toEqual({ to: "", status: 410 });
    expect(await lookupRedirect("/no-hay-regla")).toBeNull();
  });
});
