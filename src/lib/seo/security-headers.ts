/**
 * Security headers for every response (US-38). Read by next.config.ts at
 * build time.
 *
 * CSP notes:
 * - Scripts allow 'unsafe-inline' because pages are prerendered (PPR) and
 *   Next's inline bootstrap scripts cannot carry a per-request nonce there.
 *   Everything else is locked to this origin.
 * - form-action allows Redsys and PAYCOMET: "Pagar con tarjeta" posts the signed
 *   form to Redsys, or is redirected to the PAYCOMET or Stripe hosted page.
 * - Outside Vercel production, localhost is allowed for the e2e fake gateway.
 * - Ad pixels (Meta, TikTok, Google tag / GTM) load only after the visitor
 *   accepts the cookie banner; their hosts are allowed here so the media
 *   buyer can switch them on from Admin > Integraciones without a deploy.
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
  const adScripts = [
    "https://connect.facebook.net",
    "https://analytics.tiktok.com",
    "https://www.googletagmanager.com",
    "https://*.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://googleads.g.doubleclick.net",
    "https://www.googleadservices.com",
  ].join(" ");
  const adConnect = [
    "https://www.facebook.com",
    "https://connect.facebook.net",
    "https://*.tiktok.com",
    "https://*.tiktokw.us",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://*.googletagmanager.com",
    "https://*.g.doubleclick.net",
    "https://www.google.com",
    "https://www.googleadservices.com",
  ].join(" ");
  const adImages = [
    "https://www.facebook.com",
    "https://*.tiktok.com",
    "https://*.google-analytics.com",
    "https://*.googletagmanager.com",
    "https://*.g.doubleclick.net",
    "https://www.google.com",
    "https://www.google.es",
    "https://www.googleadservices.com",
  ].join(" ");

  const csp = [
    `default-src 'self'`,
    `script-src ${src("'self'", "'unsafe-inline'", adScripts, vercel)}`,
    `style-src 'self' 'unsafe-inline'`,
    // OpenStreetMap tiles for route maps in tour descriptions (no API key).
    `img-src ${src("'self'", "data:", "blob:", supabase, "https://tripcelona.com", "https://tile.openstreetmap.org", adImages, vercel)}`,
    // Mixkit CDN serves the default free-license hero video.
    `media-src ${src("'self'", supabase, "https://assets.mixkit.co")}`,
    `font-src 'self' data:`,
    `connect-src ${src("'self'", supabase, supabaseWs, adConnect, vercel, local)}`,
    // GTM preview mode and Google Ads conversion frames.
    `frame-src ${src("https://www.googletagmanager.com", "https://td.doubleclick.net", vercel)}`,
    `form-action ${src("'self'", "https://sis.redsys.es", "https://sis-t.redsys.es:25443", "https://*.paycomet.com", "https://checkout.stripe.com", local)}`,
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
