import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { getSiteSettings, whatsappLink } from "@/lib/settings";

export async function WhatsAppCta({
  message,
  label = "Pregúntanos por WhatsApp",
}: {
  message: string;
  label?: string;
}) {
  const site = await getSiteSettings();
  return (
    <ButtonLink
      href={whatsappLink(site, message)}
      variant="whatsapp"
      target="_blank"
      rel="noopener noreferrer"
      data-analytics="whatsapp_click"
    >
      <WhatsAppIcon /> {label}
    </ButtonLink>
  );
}

/** FR-13: shown when the filters return nothing. */
export function CatalogEmptyState() {
  return (
    <div className="rounded-2xl bg-secondary px-6 py-12 text-center">
      <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white shadow-lg">
        <SearchX aria-hidden className="size-6" />
      </span>
      <h2 className="text-display-sm">No hay salidas con estos filtros</h2>
      <p className="mx-auto mt-2 max-w-md text-tertiary">
        Prueba con otro mes o destino, o escríbenos: organizamos salidas a medida para grupos.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <WhatsAppCta message="Hola, busco una excursión que no aparece en la web." />
        <ButtonLink href="/ofertas-de-viajes" variant="outline">
          Ver todas las excursiones
        </ButtonLink>
      </div>
    </div>
  );
}
