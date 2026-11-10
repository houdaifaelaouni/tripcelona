/**
 * Security headers for every response (US-38). Read by next.config.ts at
 * build time.
 *
 * CSP notes:
 * - Scripts allow 'unsafe-inline' because pages are prerendered (PPR) and
 *   Next's inline bootstrap scripts cannot carry a per-request nonce there.
 *   Everything else is locked to this origin.
 * - form-action allows Redsys: "Pagar con tarjeta" posts the signed form to
 *   the bank's payment page.
 * - Outside Vercel production, localhost is allowed for the e2e fake gateway.
 * - Analytics (decision D8) is not loaded today; adding GTM/GA4 needs its
 *   hosts here and a consent banner first.
 */
export function securityHeaders(env: {
  supabaseUrl?: string;
  production: boolean;
  preview: boolean;
}): { key: string; value: string }[] {
  const supabase = env.supabaseUrl ? new URL(env.supabaseUrl).origin : "";
  const supabaseWs = supabase.replace(/^http/, "ws");
  const local = env.production ? "" : "http://localhost:* http://127.0.0.1:*";
  const vercel = env.preview ? "https://vercel.live" : "";
  const src = (...parts: string[]) => parts.filter(Boolean).join(" ");

  const csp = [
    `default-src 'self'`,
    `script-src ${src("'self'", "'unsafe-inline'", vercel)}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src ${src("'self'", "data:", "blob:", supabase, "https://tripcelona.com", vercel)}`,
    `media-src ${src("'self'", supabase)}`,
    `font-src 'self' data:`,
    `connect-src ${src("'self'", supabase, supabaseWs, vercel, local)}`,
    `frame-src ${src(vercel) || "'none'"}`,
    `form-action ${src("'self'", "https://sis.redsys.es", "https://sis-t.redsys.es:25443", local)}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    env.production ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    ...(env.production
      ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ]
      : []),
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
}
