import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/seo/security-headers";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // src/proxy.ts removes trailing slashes and maps legacy URLs in one 301 hop.
  skipTrailingSlashRedirect: true,
  experimental: {
    // Media library uploads (FR-87): images up to 10 MB go through a server action.
    serverActions: { bodySizeLimit: "11mb" },
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          production: process.env.VERCEL_ENV === "production",
          preview: process.env.VERCEL_ENV === "preview",
        }),
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Supabase Storage (media bucket).
      ...(supabaseHost
        ? [
            {
              protocol: supabaseHost.protocol.replace(":", "") as "http" | "https",
              hostname: supabaseHost.hostname,
              port: supabaseHost.port,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      // TEMPORARY: legacy WordPress images until the Sprint 7 media pipeline.
      { protocol: "https", hostname: "tripcelona.com", pathname: "/wp-content/uploads/**" },
    ],
    // Local Supabase runs on 127.0.0.1, which the optimizer blocks by default.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production" || process.env.CI === "true",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
