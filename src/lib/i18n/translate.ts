import { defaultLocale, type Locale } from "./config";
import { ca } from "./messages/ca";
import { en } from "./messages/en";
import { fr } from "./messages/fr";
import { it } from "./messages/it";

/*
 * Translation by source text: the Spanish sentence is the key, so Spanish
 * needs no dictionary and a missing translation falls back to Spanish
 * instead of showing a key. `{name}` placeholders are filled from `vars`.
 * tests/unit/i18n.test.ts checks that every t("…") in the source has an
 * entry in all four dictionaries.
 */
export type Dictionary = Record<string, string>;
export type TFunction = (text: string, vars?: Record<string, string | number>) => string;

const dictionaries: Record<Locale, Dictionary> = { es: {}, en, fr, ca, it };

export function createT(locale: Locale): TFunction {
  const dict = dictionaries[locale] ?? {};
  return (text, vars) => {
    const raw = locale === defaultLocale ? text : (dict[text] ?? text);
    return vars ? raw.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m)) : raw;
  };
}

export const dictionaryFor = (locale: Locale): Dictionary => dictionaries[locale];
