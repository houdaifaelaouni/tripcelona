"use server";

import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/seo/site-url";
import { createClient } from "@/lib/supabase/server";
import { safeAdminNext } from "./safe-next";

export type AuthFormState = { error?: string; info?: string };

export async function signIn(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = safeAdminNext(form.get("next"));
  if (!email || !password) return { error: "Escribe tu email y tu contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email o contraseña incorrectos." };

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    redirect(`/admin/verificar?next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const email = String(form.get("email") ?? "").trim();
  if (email) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl()}/admin/auth/confirm?next=/admin/cuenta`,
    });
  }
  // Same answer whether or not the address exists.
  return {
    info: "Si el email pertenece al equipo, recibirás un enlace para crear una contraseña.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
