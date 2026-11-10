import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/card";
import { formatDateShort, formatPrice, formatTime } from "@/lib/tours/format";
import type { Departure, TourSummary } from "@/lib/tours/types";

/** Catalog / home card (FR-10): image, title, area, price-from, next departure. */
export function TourCard({
  tour,
  departure,
  priority = false,
}: {
  tour: TourSummary;
  /** Departure to highlight; defaults to the next upcoming one. */
  departure?: Departure | null;
  priority?: boolean;
}) {
  const next = departure ?? tour.departures.find((d) => d.status === "open") ?? null;
  const price = next?.priceCents ?? tour.priceFromCents;
  const href = `/excursiones/${tour.slug}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-white shadow-card transition-shadow hover:shadow-panel">
      <div className="relative aspect-[4/3] bg-surface-alt">
        {tour.image && (
          <Image
            src={tour.image.url}
            alt={tour.image.alt}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            priority={priority}
          />
        )}
        {tour.area && (
          <Badge tone="brand" className="absolute top-3 left-3">
            {tour.area}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-lg leading-snug">
          {/* Whole card is clickable through the stretched link. */}
          <Link
            href={href}
            className="after:absolute after:inset-0 hover:text-blue focus-visible:outline-none group-focus-within:underline"
          >
            {tour.title}
          </Link>
        </h3>
        <p className="text-muted">
          {next ? (
            <>
              Próxima salida: <strong className="text-ink">{formatDateShort(next.startsAt)}</strong>{" "}
              a las {formatTime(next.startsAt)}
              {next.seatsLeft <= 10 && next.seatsLeft > 0 && (
                <span className="text-danger"> · quedan {next.seatsLeft} plazas</span>
              )}
            </>
          ) : (
            "Nuevas fechas próximamente"
          )}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2">
          {price !== null ? (
            <p>
              <span className="block text-sm text-muted">Desde</span>
              <span className="text-2xl font-bold">{formatPrice(price)}</span>
              <span className="text-sm text-muted"> / persona</span>
            </p>
          ) : (
            <span />
          )}
          <span className="font-bold text-blue group-hover:underline" aria-hidden>
            Ver excursión →
          </span>
        </div>
      </div>
    </article>
  );
}
