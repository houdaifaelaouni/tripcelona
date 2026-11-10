"use server";

import { z } from "zod";
import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { backWith } from "./redirect";
import { grantStaff } from "./staff-admin";

const inviteSchema = z.object({
  email: z.email({ error: "Email no válido." }).trim(),
  fullName: z.string().trim().max(120).optional(),
  role: z.enum(["owner", "editor"]),
});

export async function inviteStaff(form: FormData) {
  const owner = await assertStaff("owner");
  const parsed = inviteSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    backWith("/admin/equipo", {
      error: parsed.error.issues[0]?.message ?? "Revisa el formulario.",
    });
  try {
    const result = await grantStaff(parsed.data.email, parsed.data.role, {
      fullName: parsed.data.fullName,
    });
    await audit(owner.id, "staff.grant", "profiles", result.userId, {
      role: parsed.data.role,
      invited: result.invited,
    });
  } catch (error) {
    backWith("/admin/equipo", { error: `No se pudo invitar: ${(error as Error).message}` });
  }
  backWith("/admin/equipo", { ok: "invitado" });
}

export async function setStaffRole(userId: string, form: FormData) {
  const owner = await assertStaff("owner");
  const role = String(form.get("role") ?? "");
  if (!["owner", "editor", "none"].includes(role))
    backWith("/admin/equipo", { error: "Rol no válido." });
  if (userId === owner.id) backWith("/admin/equipo", { error: "No puedes cambiar tu propio rol." });

  const db = createAdminClient();
  const { error } = await db
    .from("profiles")
    .update({ role: role === "none" ? null : (role as "owner" | "editor") })
    .eq("id", userId);
  if (error) backWith("/admin/equipo", { error: error.message });
  if (role === "none") await db.auth.admin.signOut(userId).catch(() => undefined);
  await audit(owner.id, "staff.role", "profiles", userId, { role });
  backWith("/admin/equipo", { ok: "rol" });
}
