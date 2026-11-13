import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { getSiteSettings, whatsappLink } from "@/lib/settings";
import { createT } from "@/lib/i18n/translate";
import { localizePath, type Locale } from "@/lib/i18n/config";

export async function WhatsAppCta({
  message,
  label = "Pregúntanos por WhatsApp",
  locale = "es",
}: {
  message: string;
  label?: string;
  locale?: Locale;
}) {
  const t = createT(locale);
  const site = await getSiteSettings();
  return (
    <ButtonLink
      href={whatsappLink(site, t(message))}
      variant="whatsapp"
      target="_blank"
      rel="noopener noreferrer"
      data-analytics="whatsapp_click"
    >
      <WhatsAppIcon /> {t(label)}
    </ButtonLink>
  );
}

/** FR-13: shown when the filters return nothing. */
export function CatalogEmptyState({ locale }: { locale: Locale }) {
  const t = createT(locale);
  return (
    <div className="rounded-2xl bg-secondary px-6 py-12 text-center">
      <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white shadow-lg">
        <SearchX aria-hidden className="size-6" />
      </span>
      <h2 className="text-display-sm">{t("No hay salidas con estos filtros")}</h2>
      <p className="mx-auto mt-2 max-w-md text-tertiary">
        {t(
          "Prueba con otro mes o destino, o escríbenos: organizamos salidas a medida para grupos.",
        )}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <WhatsAppCta
          message="Hola, busco una excursión que no aparece en la web."
          locale={locale}
        />
        <ButtonLink href="/ofertas-de-viajes" variant="outline">
          {t("Ver todas las excursiones")}
        </ButtonLink>
      </div>
    </div>
  );
}
