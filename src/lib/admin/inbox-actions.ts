"use server";

import { z } from "zod";
import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { backWith } from "./redirect";

const schema = z.object({
  status: z.enum(["new", "quoted", "won", "lost"]),
  admin_notes: z
    .string()
    .max(10000)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
});

/** FR-42/FR-84: quote request status and notes (owner: personal data). */
export async function updateQuoteRequest(id: string, form: FormData) {
  const staff = await assertStaff("owner");
  const back = `/admin/solicitudes/${id}`;
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) backWith(back, { error: "Estado no válido." });
  const db = await createClient();
  const { error } = await db.from("tour_requests").update(parsed.data).eq("id", id);
  if (error) backWith(back, { error: `No se pudo guardar: ${error.message}` });
  await audit(staff.id, "request.update", "tour_requests", id, { status: parsed.data.status });
  backWith(back, { ok: "estado" });
}

/** Contact messages share the same statuses and notes. */
export async function updateContactMessage(id: string, form: FormData) {
  const staff = await assertStaff("owner");
  const back = `/admin/solicitudes/mensajes/${id}`;
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) backWith(back, { error: "Estado no válido." });
  const db = await createClient();
  const { error } = await db.from("leads").update(parsed.data).eq("id", id);
  if (error) backWith(back, { error: `No se pudo guardar: ${error.message}` });
  await audit(staff.id, "lead.update", "leads", id, { status: parsed.data.status });
  backWith(back, { ok: "estado" });
}
