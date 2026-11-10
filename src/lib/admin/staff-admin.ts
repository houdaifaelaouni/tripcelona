import "server-only";
import { siteUrl } from "@/lib/seo/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

export type StaffRoleInput = "owner" | "editor";

async function findUserIdByEmail(email: string): Promise<string | null> {
  const db = createAdminClient();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

/**
 * Give someone a staff role. New people get an invite email (or, from the
 * ops command, an account with a password); existing accounts just get the
 * role. Public sign-up stays disabled, so this is the only way in (US-24).
 */
export async function grantStaff(
  email: string,
  role: StaffRoleInput,
  options: { password?: string; fullName?: string } = {},
): Promise<{ userId: string; invited: boolean }> {
  const db = createAdminClient();
  let userId = await findUserIdByEmail(email);
  let invited = false;

  if (!userId) {
    if (options.password) {
      const { data, error } = await db.auth.admin.createUser({
        email,
        password: options.password,
        email_confirm: true,
        user_metadata: { full_name: options.fullName ?? null },
      });
      if (error) throw new Error(error.message);
      userId = data.user.id;
    } else {
      const { data, error } = await db.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${siteUrl()}/admin/auth/confirm?next=/admin/cuenta`,
        data: { full_name: options.fullName ?? null },
      });
      if (error) throw new Error(error.message);
      userId = data.user.id;
      invited = true;
    }
  }

  const { error } = await db
    .from("profiles")
    .upsert({ id: userId, role, full_name: options.fullName ?? undefined }, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return { userId, invited };
}
