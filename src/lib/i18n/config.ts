/** Languages of the public site. Spanish is the default and has no URL prefix. */
export const locales = ["es", "en", "fr", "ca", "it"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

export const isLocale = (value: string | undefined | null): value is Locale =>
  !!value && (locales as readonly string[]).includes(value);

export const localeNames: Record<Locale, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  ca: "Català",
  it: "Italiano",
};

/** BCP 47 / OpenGraph locale codes. */
export const ogLocales: Record<Locale, string> = {
  es: "es_ES",
  en: "en_GB",
  fr: "fr_FR",
  ca: "ca_ES",
  it: "it_IT",
};

const isExternal = (href: string) =>
  /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href) || href === "" || !href.startsWith("/");

/** "/excursiones/x" -> "/en/excursiones/x" (Spanish stays unprefixed). External links pass through. */
export function localizePath(href: string, locale: Locale): string {
  if (isExternal(href) || locale === defaultLocale) return href;
  // Never prefix areas that are not part of the translated site.
  if (/^\/(admin|api|health|wp-content|brand)(\/|$|\?|#)/.test(href)) return href;
  if (href === "/") return `/${locale}`;
  if (/^\/[?#]/.test(href)) return `/${locale}${href.slice(1)}`;
  return `/${locale}${href}`;
}

/** "/en/excursiones/x" -> { locale: "en", path: "/excursiones/x" }; no prefix means Spanish. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const m = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  if (m && isLocale(m[1]) && m[1] !== defaultLocale) return { locale: m[1], path: m[2] || "/" };
  return { locale: defaultLocale, path: pathname };
}
