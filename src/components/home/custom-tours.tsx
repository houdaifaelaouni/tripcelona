import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import type { TourImage } from "@/lib/tours/types";

/**
 * Wide band for the custom-tour offer (the second product next to the
 * catalog), in the reference page's "multi-day routes" slot: tinted section,
 * header with a link, and one large split card.
 */
export function CustomTours({ image }: { image: TourImage | null }) {
  return (
    <section aria-labelledby="a-medida-heading" className="bg-secondary py-16 md:py-24">
      <div className="container-site">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-brand-secondary md:text-md">A tu medida</p>
            <h2
              id="a-medida-heading"
              className="mt-3 text-3xl leading-[1.2] font-semibold tracking-tight text-primary md:text-4xl"
            >
              Diseñamos el viaje que imaginas
            </h2>
            <p className="mt-4 text-lg text-tertiary md:text-xl">
              Porque un viaje no es un destino, es una historia que vives.
            </p>
          </div>
          <Link href="/crea-tu-tour" className={buttonClasses({ variant: "outline" }, "shrink-0")}>
            Cuéntanos tu idea
          </Link>
        </div>

        <div className="mt-12 overflow-hidden rounded-panel bg-primary shadow-xs ring-1 ring-secondary ring-inset">
          <div className="grid md:grid-cols-2">
            <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[340px]">
              {image ? (
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 744px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div aria-hidden className="h-full w-full bg-brand-section" />
              )}
            </div>
            <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
              <p className="text-xs font-semibold tracking-wide text-brand-secondary uppercase">
                Escapadas, grupos y viajes de varios días
              </p>
              <h3 className="text-2xl font-semibold text-primary">
                ¿Vais en grupo y queréis algo distinto?
              </h3>
              <p className="text-md text-tertiary">
                Cuéntanos las fechas, cuántos sois y qué os gustaría ver. Preparamos una propuesta
                con el itinerario, el transporte y las visitas.
              </p>
              <Link
                href="/crea-tu-tour"
                className={buttonClasses({ size: "md" }, "mt-2 self-start")}
              >
                Cuéntanos tu viaje
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
