import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/card";
import { ArrowUpRight, Calendar, Clock } from "lucide-react";
import {
  dateParts,
  formatDateShort,
  formatDuration,
  formatPrice,
  formatTime,
} from "@/lib/tours/format";
import type { Departure, TourSummary } from "@/lib/tours/types";

/**
 * Catalog / home card (FR-10) in the Untitled UI blog-card layout (MIT, see
 * THIRD_PARTY_NOTICES.md): photo with a date tile, area badge, title, next
 * departure, price-from and an arrow link. The whole card is one link
 * through the stretched title link.
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

  const date = next ? dateParts(next.startsAt) : null;

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-2xl bg-primary shadow-xs ring-1 ring-secondary ring-inset transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {tour.image && (
          <Image
            src={tour.image.url}
            alt={tour.image.alt}
            fill
            sizes="(min-width: 1440px) 320px, (min-width: 1128px) 33vw, (min-width: 744px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
            priority={priority}
          />
        )}
        {date && (
          <div
            aria-hidden
            className="absolute top-3 left-3 flex min-w-14 flex-col items-center rounded-xl bg-primary px-2.5 py-1.5 text-center shadow-md"
          >
            <span className="text-xs font-semibold text-brand-secondary uppercase">
              {date.month}
            </span>
            <span className="text-xl leading-6 font-bold text-primary">{date.day}</span>
          </div>
        )}
        {fewSeats && (
          <div className="absolute top-3 right-3">
            <Badge tone="accent">Últimas plazas</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        {tour.area && <p className="text-sm font-semibold text-brand-secondary">{tour.area}</p>}
        <h3 className="flex items-start justify-between gap-4 text-lg font-semibold text-primary">
          <Link
            href={href}
            className="line-clamp-2 after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none group-hover:underline group-focus-within:underline"
          >
            {tour.title}
          </Link>
          <ArrowUpRight aria-hidden className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
        </h3>
        <ul className="flex flex-col gap-1.5 text-sm text-tertiary">
          <li className="flex items-center gap-2">
            <Calendar aria-hidden className="size-4 shrink-0 text-fg-quaternary" />
            {next ? (
              <span>
                Próxima salida: {formatDateShort(next.startsAt)} a las {formatTime(next.startsAt)}
                {fewSeats && (
                  <span className="text-error-primary"> · quedan {next.seatsLeft} plazas</span>
                )}
              </span>
            ) : (
              "Nuevas fechas próximamente"
            )}
          </li>
          {tour.durationMinutes !== null && (
            <li className="flex items-center gap-2">
              <Clock aria-hidden className="size-4 shrink-0 text-fg-quaternary" />
              {formatDuration(tour.durationMinutes)}
            </li>
          )}
        </ul>
        {price !== null && (
          <p className="mt-auto border-t border-secondary pt-3">
            <span className="text-sm text-tertiary">Desde </span>
            <span className="text-lg font-semibold text-primary">{formatPrice(price)}</span>
            <span className="text-sm text-tertiary"> / persona</span>
          </p>
        )}
      </div>
    </article>
  );
}
