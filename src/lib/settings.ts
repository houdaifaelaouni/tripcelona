import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { site } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";

/** Cache tag for public settings; the settings form calls updateTag(SETTINGS_TAG). */
export const SETTINGS_TAG = "settings";

export const SOCIAL_NETWORKS = ["instagram", "facebook", "tiktok", "youtube", "linkedin"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];
export const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
};

export type SiteSettings = {
  phoneDisplay: string;
  phoneHref: string;
  whatsappDisplay: string;
  whatsappHref: string;
  email: string | null;
  socials: Partial<Record<SocialNetwork, string>>;
  banner: { active: boolean; text: string; href: string };
  quoteExtras: string[];
  quoteNote: string | null;
  meetingPoint: string;
  /** Owner identity for the legal pages (LSSI-CE art. 10). */
  legal: { titular: string | null; nif: string | null; domicilio: string | null };
};

const digits = (s: string) => s.replace(/[^\d+]/g, "");

export function settingsFromRows(rows: { key: string; value: unknown }[]): SiteSettings {
  const v = new Map(rows.map((r) => [r.key, r.value]));
  const str = (key: string) => {
    const x = v.get(key);
    return typeof x === "string" && x.trim() ? x.trim() : null;
  };
  const phone = str("phone") ?? site.phoneDisplay;
  const whatsapp = str("whatsapp") ?? phone;
  const socialsRaw = v.get("socials");
  const socials: SiteSettings["socials"] = {};
  if (socialsRaw && typeof socialsRaw === "object") {
    for (const net of SOCIAL_NETWORKS) {
      const url = (socialsRaw as Record<string, unknown>)[net];
      if (typeof url === "string" && /^https:\/\//.test(url)) socials[net] = url;
    }
  }
  const bannerRaw = (v.get("banner") ?? {}) as Record<string, unknown>;
  const extras = v.get("quote_extras");
  const legalRaw = (v.get("legal_identity") ?? {}) as Record<string, unknown>;
  const legalStr = (k: string) =>
    typeof legalRaw[k] === "string" && (legalRaw[k] as string).trim()
      ? (legalRaw[k] as string).trim()
      : null;
  return {
    phoneDisplay: phone,
    phoneHref: `tel:${digits(phone)}`,
    whatsappDisplay: whatsapp,
    whatsappHref: `https://wa.me/${digits(whatsapp).replace(/^\+/, "")}`,
    email: str("email"),
    socials,
    banner: {
      active:
        bannerRaw.active === true && typeof bannerRaw.text === "string" && !!bannerRaw.text.trim(),
      text: typeof bannerRaw.text === "string" ? bannerRaw.text : "",
      href: typeof bannerRaw.href === "string" ? bannerRaw.href : "",
    },
    quoteExtras: Array.isArray(extras)
      ? extras.filter((e): e is string => typeof e === "string")
      : [],
    quoteNote: str("quote_note"),
    meetingPoint: str("meeting_point") ?? site.meetingPoint,
    legal: { titular: legalStr("titular"), nif: legalStr("nif"), domicilio: legalStr("domicilio") },
  };
}

/** Public settings (phone, WhatsApp, email, socials, banner). Cached; refreshed on save. */
export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");
  const { data, error } = await createPublicClient().from("settings").select("key, value");
  if (error) {
    console.error("[settings] falling back to defaults:", error.message);
    return settingsFromRows([]);
  }
  return settingsFromRows(data ?? []);
}

export function whatsappLink(settings: SiteSettings, message?: string): string {
  return message
    ? `${settings.whatsappHref}?text=${encodeURIComponent(message)}`
    : settings.whatsappHref;
}

/** Values for `[tripola dato="x"]` tokens in the legal pages. */
export function legalTokens(s: SiteSettings): Record<string, string> {
  const t: Record<string, string> = { web: "tripcelona.com", telefono: s.phoneDisplay };
  if (s.email) t.email = s.email;
  if (s.legal.titular) t.titular = s.legal.titular;
  if (s.legal.nif) t.nif = s.legal.nif;
  if (s.legal.domicilio) t.domicilio = s.legal.domicilio;
  return t;
}
