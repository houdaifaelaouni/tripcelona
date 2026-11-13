"use client";

import { Globe } from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { iconButtonClasses } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { localeNames, localizePath, locales, splitLocale, type Locale } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";

function Menu({ locale }: { locale: Locale }) {
  const t = createT(locale);
  const pathname = usePathname() ?? "/";
  const { path } = splitLocale(pathname);
  return (
    <details className="group relative">
      <summary
        className={cn(
          iconButtonClasses(
            "soft",
            "md",
            "w-auto gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-semibold text-fg-tertiary uppercase ring-1 ring-secondary ring-inset hover:bg-secondary hover:text-fg-primary",
          ),
          "h-9 cursor-pointer list-none [&::-webkit-details-marker]:hidden",
        )}
      >
        <Globe size={16} aria-hidden />
        <span className="sr-only">{t("Idioma")}: </span>
        {locale}
      </summary>
      <ul className="absolute right-0 z-50 mt-2 min-w-40 rounded-xl bg-primary p-1 shadow-lg ring-1 ring-secondary">
        {locales.map((l) => (
          <li key={l}>
            <NextLink
              href={localizePath(path, l)}
              hrefLang={l}
              lang={l}
              aria-current={l === locale ? "true" : undefined}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary",
                l === locale ? "text-brand-secondary" : "text-secondary",
              )}
            >
              {localeNames[l]}
            </NextLink>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Language menu. Keeps the current page: /en/blog -> /fr/blog. */
export function LanguageSwitcher({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={null}>
      <Menu locale={locale} />
    </Suspense>
  );
}

function Links({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? "/";
  const { path } = splitLocale(pathname);
  return (
    <ul className="flex flex-wrap gap-2">
      {locales.map((l) => (
        <li key={l}>
          <NextLink
            href={localizePath(path, l)}
            hrefLang={l}
            lang={l}
            aria-current={l === locale ? "true" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-3 text-sm font-medium ring-1 ring-secondary ring-inset hover:bg-secondary",
              l === locale ? "bg-brand-primary text-brand-secondary" : "text-secondary",
            )}
          >
            {localeNames[l]}
          </NextLink>
        </li>
      ))}
    </ul>
  );
}

/** Language links for the mobile drawer. */
export function LanguageLinks({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={null}>
      <Links locale={locale} />
    </Suspense>
  );
}
