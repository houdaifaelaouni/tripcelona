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

/**
 * Messages built on the server carry their numbers ("Solo quedan 3 plazas."),
 * so they have no exact entry. Retry with the digits replaced by {n}.
 */
function lookup(dict: Dictionary, text: string): string {
  const exact = dict[text];
  if (exact !== undefined) return exact;
  const digits = text.match(/\d+/g);
  if (!digits) return text;
  const template = dict[text.replace(/\d+/g, "{n}")];
  if (template === undefined) return text;
  let i = 0;
  return template.replace(/\{n\}/g, () => digits[i++] ?? "");
}

export function createT(locale: Locale): TFunction {
  const dict = dictionaries[locale] ?? {};
  return (text, vars) => {
    const raw = locale === defaultLocale ? text : lookup(dict, text);
    return vars ? raw.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m)) : raw;
  };
}

export const dictionaryFor = (locale: Locale): Dictionary => dictionaries[locale];
