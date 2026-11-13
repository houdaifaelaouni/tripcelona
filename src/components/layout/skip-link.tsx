import type { Locale } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";

export function SkipLink({ locale }: { locale: Locale }) {
  const t = createT(locale);
  return (
    <a
      href="#contenido"
      className="sr-only z-50 rounded-lg bg-brand-solid px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      {t("Saltar al contenido")}
    </a>
  );
}
