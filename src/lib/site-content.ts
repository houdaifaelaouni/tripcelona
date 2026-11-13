import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { SETTINGS_TAG } from "@/lib/settings";
import { createPublicClient } from "@/lib/supabase/public";
import {
  footerFromValue,
  homeFromValue,
  navFromValue,
  type FooterColumn,
  type HomeContent,
  type NavLink,
} from "./site-content-shared";

export type SiteContent = { home: HomeContent; nav: NavLink[]; footer: FooterColumn[] };

/** Rows in the `settings` table that hold the owner's edits. */
export const CONTENT_KEYS = {
  home: "home_content",
  nav: "nav_primary",
  footer: "nav_footer",
} as const;

export function contentFromRows(rows: { key: string; value: unknown }[]): SiteContent {
  const v = new Map(rows.map((r) => [r.key, r.value]));
  return {
    home: homeFromValue(v.get(CONTENT_KEYS.home)),
    nav: navFromValue(v.get(CONTENT_KEYS.nav)),
    footer: footerFromValue(v.get(CONTENT_KEYS.footer)),
  };
}

/** Home texts, menu and footer links: the owner's edits over the launch defaults. Cached; refreshed on save. */
export async function getSiteContent(): Promise<SiteContent> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");
  const { data, error } = await createPublicClient().from("settings").select("key, value");
  if (error) {
    console.error("[site-content] falling back to defaults:", error.message);
    return contentFromRows([]);
  }
  return contentFromRows(data ?? []);
}
