import { ButtonLink } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { site } from "@/lib/site";

export function WhatsAppCta({
  message,
  label = "Pregúntanos por WhatsApp",
}: {
  message: string;
  label?: string;
}) {
  return (
    <ButtonLink
      href={`${site.whatsappHref}?text=${encodeURIComponent(message)}`}
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
    <div className="rounded-panel border border-dashed border-border-strong p-8 text-center">
      <h2 className="text-xl">No hay salidas con estos filtros</h2>
      <p className="mx-auto mt-2 max-w-md text-muted">
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
