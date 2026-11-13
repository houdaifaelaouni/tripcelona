import Image from "next/image";
import Link from "@/components/i18n/link";
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
import { createT } from "@/lib/i18n/translate";
import type { Locale } from "@/lib/i18n/config";

/**
 * Catalog / home card (FR-10): hairline card after the Untitled UI blog-card layout (MIT, see
 * THIRD_PARTY_NOTICES.md): photo with a date tile, area badge, title, next
 * departure, price-from and an arrow link. The whole card is one link
 * through the stretched title link.
 */
export function TourCard({
  tour,
  departure,
  priority = false,
  locale = "es",
}: {
  locale?: Locale;
  tour: TourSummary;
  /** Departure to highlight; defaults to the next upcoming one. */
  departure?: Departure | null;
  priority?: boolean;
}) {
  const t = createT(locale);
  const next = departure ?? tour.departures.find((d) => d.status === "open") ?? null;
  const price = next?.priceCents ?? tour.priceFromCents;
  const href = `/excursiones/${tour.slug}`;
  const fewSeats = next !== null && next.seatsLeft > 0 && next.seatsLeft <= 10;

  const date = next ? dateParts(next.startsAt, locale) : null;

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-xl bg-primary ring-1 ring-secondary ring-inset transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0">
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
            className="absolute top-3 left-3 flex min-w-12 flex-col items-center rounded-lg bg-primary/95 px-2 py-1 text-center ring-1 ring-black/5 backdrop-blur"
          >
            <span className="text-[11px] font-medium tracking-[0.06em] text-brand-secondary uppercase">
              {date.month}
            </span>
            <span className="text-lg leading-6 font-semibold tracking-tight text-primary">
              {date.day}
            </span>
          </div>
        )}
        {fewSeats && (
          <div className="absolute top-3 right-3">
            <Badge tone="accent">{t("Últimas plazas")}</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        {tour.area && (
          <p className="text-[13px] font-medium tracking-[0.02em] text-quaternary">
            {t(tour.area)}
          </p>
        )}
        <h3 className="flex items-start justify-between gap-4 text-lg leading-snug font-semibold tracking-tight text-primary">
          <Link
            href={href}
            className="line-clamp-2 after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none group-focus-within:underline"
          >
            {t(tour.title)}
          </Link>
          <ArrowUpRight
            aria-hidden
            className="mt-0.5 size-5 shrink-0 text-fg-quaternary transition-colors group-hover:text-fg-brand-primary"
          />
        </h3>
        <ul className="flex flex-col gap-1.5 text-sm text-tertiary">
          <li className="flex items-center gap-2">
            <Calendar aria-hidden className="size-4 shrink-0 text-fg-quaternary" />
            {next ? (
              <span>
                {t("Próxima salida: {date} a las {time}", {
                  date: formatDateShort(next.startsAt, locale),
                  time: formatTime(next.startsAt, locale),
                })}
                {fewSeats && (
                  <span className="text-error-primary">
                    {" "}
                    · {t("quedan {n} plazas", { n: next.seatsLeft })}
                  </span>
                )}
              </span>
            ) : (
              t("Nuevas fechas próximamente")
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
            <span className="text-sm text-tertiary">{t("Desde")} </span>
            <span className="text-lg font-semibold tracking-tight text-primary">
              {formatPrice(price, locale)}
            </span>
            <span className="text-sm text-tertiary"> / {t("persona")}</span>
          </p>
        )}
      </div>
    </article>
  );
}
