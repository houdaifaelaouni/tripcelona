"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { createT, type TFunction } from "@/lib/i18n/translate";

const LocaleContext = createContext<Locale>(defaultLocale);

/** Gives client components the current language (set once in the [lang] layout). */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export const useLocale = (): Locale => useContext(LocaleContext);

/** Translate in client components: `const t = useT(); t("Ver excursiones")`. */
export function useT(): TFunction {
  const locale = useLocale();
  return useMemo(() => createT(locale), [locale]);
}
