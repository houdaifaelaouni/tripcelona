import { ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/card";
import { dateParts, formatDateLong, formatPrice, weekdayShort } from "@/lib/tours/format";
import type { Departure, TourSummary } from "@/lib/tours/types";
import { cn } from "@/lib/cn";
import { CardPhotos } from "./card-photos";

/**
 * Catalog / home card: photo carousel with the departure date tile and a
 * sold-out badge, area, title, full date, one-line summary and price beside
 * the "Ver viaje" affordance. The whole card is one link through the
 * stretched title link; carousel buttons sit above it.
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
  const next = departure ?? tour.departures[0] ?? null;
  const price = next?.priceCents ?? tour.priceFromCents;
  const href = `/excursiones/${tour.slug}`;
  const soldOut = next !== null && (next.status === "sold_out" || next.seatsLeft <= 0);
  const fewSeats = next !== null && !soldOut && next.seatsLeft <= 10;
  const parts = next ? dateParts(next.startsAt) : null;

  return (
    <article
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-card bg-primary shadow-xs ring-1 ring-secondary ring-inset transition-shadow hover:shadow-lg",
        soldOut && "opacity-95",
      )}
    >
      <CardPhotos
        images={tour.gallery ?? (tour.image ? [tour.image] : [])}
        priority={priority}
        date={
          next && parts
            ? { weekday: weekdayShort(next.startsAt), day: parts.day, month: parts.month }
            : null
        }
        badge={
          soldOut ? (
            <Badge tone="danger">Agotado</Badge>
          ) : fewSeats && next ? (
            <Badge tone="accent">Últimas {next.seatsLeft} plazas</Badge>
          ) : undefined
        }
      />

      <div className="flex flex-1 flex-col gap-3 p-5">
        {tour.area && (
          <p className="text-xs font-semibold tracking-wide text-brand-secondary uppercase">
            {tour.area}
          </p>
        )}
        <h3 className="text-lg leading-snug font-semibold text-primary">
          <Link
            href={href}
            className="line-clamp-2 after:absolute after:inset-0 after:rounded-card focus-visible:outline-none group-hover:underline group-focus-within:underline"
          >
            {tour.title}
          </Link>
        </h3>

        {next && (
          <p className="flex items-start gap-2 text-sm text-tertiary">
            <Calendar aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
            <span className="first-letter:uppercase">{formatDateLong(next.startsAt)}</span>
          </p>
        )}

        {tour.summary && <p className="line-clamp-3 text-sm text-tertiary">{tour.summary}</p>}

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-secondary pt-3">
          {price !== null ? (
            <span>
              <small className="block text-xs font-medium text-quaternary">Precio</small>
              <span className="text-lg font-semibold text-primary">{formatPrice(price)}</span>
            </span>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1 text-sm font-semibold text-brand-secondary">
            Ver viaje
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </span>
        </div>
      </div>
    </article>
  );
}
