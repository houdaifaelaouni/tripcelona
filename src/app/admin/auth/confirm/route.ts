import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeAdminNext } from "@/lib/admin/safe-next";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing for invite and password-reset emails. Handles both the PKCE `code`
 * and the `token_hash` link formats, then continues to the account page where
 * the person sets a password.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeAdminNext(url.searchParams.get("next"), "/admin/cuenta");
  const supabase = await createClient();

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: new Error("missing token") };

  const target = request.nextUrl.clone();
  target.search = "";
  if (error) {
    target.pathname = "/admin/login";
    target.searchParams.set("aviso", "enlace");
  } else {
    target.pathname = next;
  }
  return NextResponse.redirect(target);
}
