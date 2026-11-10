import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";
import { safeHref } from "@/lib/content/rich-text";

/** FR-86: optional site-wide notice, edited in Admin → Ajustes. */
export async function SiteBanner() {
  const { banner } = await getSiteSettings();
  if (!banner.active) return null;
  const href = safeHref(banner.href);
  return (
    <div className="bg-yellow text-ink">
      <p className="container-site py-2 text-center text-sm font-bold">
        {href ? (
          <Link href={href} className="underline underline-offset-2">
            {banner.text}
          </Link>
        ) : (
          banner.text
        )}
      </p>
    </div>
  );
}
