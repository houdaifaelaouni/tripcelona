import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Append-only admin trail (FR-82). Never blocks the action it records. */
export async function audit(
  actor: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  diff?: Record<string, unknown>,
) {
  const { error } = await createAdminClient()
    .from("audit_log")
    .insert({ actor, action, entity, entity_id: entityId, diff: (diff ?? null) as never });
  if (error) console.error("[audit] failed", action, entity, entityId, error.message);
}
