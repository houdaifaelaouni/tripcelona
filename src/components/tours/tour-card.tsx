import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/card";
import { formatDateShort, formatPrice, formatTime } from "@/lib/tours/format";
import type { Departure, TourSummary } from "@/lib/tours/types";

/**
 * Catalog / home card (FR-10): photo-first listing card, adapted from
 * Opensource UI (MIT, © 2026 Bidyut Kundu; see THIRD_PARTY_NOTICES.md).
 * Image, area, title, next departure and price-from. The whole card is one
 * link through the stretched title link.
 */
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
  const fewSeats = next !== null && next.seatsLeft > 0 && next.seatsLeft <= 10;

  return (
    <article className="group relative flex w-full flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-card bg-surface-alt">
        {tour.image && (
          <Image
            src={tour.image.url}
            alt={tour.image.alt}
            fill
            sizes="(min-width: 1440px) 320px, (min-width: 1128px) 33vw, (min-width: 744px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            priority={priority}
          />
        )}
        <div className="absolute inset-x-3 top-3 flex flex-wrap gap-2">
          {tour.area && <Badge tone="light">{tour.area}</Badge>}
          {fewSeats && <Badge tone="accent">Últimas plazas</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="line-clamp-2 text-base font-semibold">
          <Link
            href={href}
            className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none group-hover:underline group-focus-within:underline"
          >
            {tour.title}
          </Link>
        </h3>
        <p className="text-meta text-muted">
          {next ? (
            <>
              Próxima salida: {formatDateShort(next.startsAt)} a las {formatTime(next.startsAt)}
              {fewSeats && <span className="text-danger"> · quedan {next.seatsLeft} plazas</span>}
            </>
          ) : (
            "Nuevas fechas próximamente"
          )}
        </p>
        {price !== null && (
          <p className="mt-1">
            <span className="text-meta text-muted">Desde </span>
            <span className="font-semibold">{formatPrice(price)}</span>
            <span className="text-meta text-muted"> / persona</span>
          </p>
        )}
      </div>
    </article>
  );
}
