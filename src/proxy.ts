import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canonicalRedirect, isGone, slugLookup } from "@/lib/seo/legacy";
import { slugExists } from "@/lib/seo/slug-registry";

/** Path with no matching route: Next answers it with the not-found page and a 404 status. */
const NOT_FOUND_PATH = "/__no-encontrada__/404";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/admin" || path.startsWith("/admin/")) return adminGate(request);

  if (isGone(path.replace(/\/+$/, ""))) {
    return new NextResponse("Gone", {
      status: 410,
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
    });
  }
  // Legacy WordPress URLs and trailing slashes: one 301 hop (US-33).
  // A plain URL, not nextUrl.clone(): NextURL would put the trailing slash back.
  const target = canonicalRedirect(path);
  if (target)
    return NextResponse.redirect(new URL(target + request.nextUrl.search, request.url), 301);

  // Unknown slugs get a real 404 status instead of a streamed not-found page.
  const lookup = slugLookup(path);
  if (lookup && !(await slugExists(lookup.kind, lookup.slug))) {
    return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url));
  }
  return NextResponse.next();
}

/**
 * Admin gate (US-24). Refreshes the Supabase session cookie and sends
 * signed-out visitors to the login page. This is only the first line: every
 * admin page and server action checks the role again on the server.
 */
async function adminGate(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet)
            response.cookies.set(name, value, options);
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  const isPublicAdminPath = path === "/admin/login" || path.startsWith("/admin/auth/");
  if (!data?.claims && !isPublicAdminPath) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = "";
    if (path !== "/admin") login.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(login);
  }
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  // Everything except Next internals, API routes and the health check.
  matcher: ["/((?!_next/|api/|health$|favicon\\.ico$|icon\\.png$|brand/).*)"],
};
