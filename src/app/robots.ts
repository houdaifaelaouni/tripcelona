import type { MetadataRoute } from "next";
import { indexingAllowed, siteUrl } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  if (!indexingAllowed()) {
    // Previews and pre-launch production: keep everything out of search.
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/reservar", "/admin", "/api"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
