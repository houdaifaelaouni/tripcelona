import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "owner" | "editor";
export type Staff = { id: string; email: string; name: string | null; role: StaffRole };

type StaffCheck =
  | { status: "ok"; staff: Staff }
  | { status: "signed_out" }
  | { status: "mfa_required" }
  | { status: "no_role" }
  | { status: "forbidden"; staff: Staff };

/**
 * Server-side role check (US-24). Reads the user from the verified session,
 * the role from `profiles`, and requires the MFA level the user enrolled.
 */
export async function checkStaff(required: StaffRole | "any" = "any"): Promise<StaffCheck> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    return { status: "mfa_required" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.role) return { status: "no_role" };

  const staff: Staff = {
    id: user.id,
    email: user.email ?? "",
    name: profile.full_name,
    role: profile.role,
  };
  if (required === "owner" && staff.role !== "owner") return { status: "forbidden", staff };
  return { status: "ok", staff };
}

/** For pages: redirects instead of rendering anything sensitive. */
export async function requireStaff(required: StaffRole | "any" = "any"): Promise<Staff> {
  const check = await checkStaff(required);
  switch (check.status) {
    case "ok":
      return check.staff;
    case "signed_out":
      redirect("/admin/login");
    case "mfa_required":
      redirect("/admin/verificar");
    case "no_role":
      redirect("/admin/sin-acceso");
    case "forbidden":
      redirect("/admin?aviso=solo-propietario");
  }
}

export class AdminAccessError extends Error {}

/** For server actions: throws, so a forged POST never reaches the data. */
export async function assertStaff(required: StaffRole | "any" = "any"): Promise<Staff> {
  const check = await checkStaff(required);
  if (check.status !== "ok") throw new AdminAccessError(`Admin access denied: ${check.status}`);
  return check.staff;
}
