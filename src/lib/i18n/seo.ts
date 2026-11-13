import { defaultLocale, localizePath, locales, type Locale } from "./config";

/** Canonical URL for this language plus hreflang links to every translation. */
export function alternatesFor(path: string, locale: Locale) {
  return {
    canonical: localizePath(path, locale),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, localizePath(path, l)])),
      "x-default": localizePath(path, defaultLocale),
    },
  };
}
