import type { ReactNode } from "react";
import Image from "next/image";
import Link from "@/components/i18n/link";
import { Badge } from "@/components/ui/card";
import { ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import {
  dateParts,
  departureMinutes,
  formatDateShort,
  formatDuration,
  formatPrice,
  formatTime,
} from "@/lib/tours/format";
import type { Departure, TourSummary } from "@/lib/tours/types";
import { createT } from "@/lib/i18n/translate";
import type { Locale } from "@/lib/i18n/config";

/**
 * Catalog / home card (FR-10): photo with a date tile, area, title, a short
 * teaser, icon facts (next departure, duration, meeting point) and a
 * full-width blue footer bar with "Ver viaje" and the price. The whole card
 * is one link through the stretched title link.
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
  const minutes = tour.durationMinutes ?? (next ? departureMinutes(next) : null);

  const date = next ? dateParts(next.startsAt, locale) : null;

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary ring-inset transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0">
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
            className="absolute top-3 left-3 flex min-w-12 flex-col items-center rounded-lg bg-primary/95 px-2 py-1 text-center shadow-sm ring-1 ring-black/5 backdrop-blur"
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
        {tour.area && (
          <p className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary/95 px-2.5 py-1 text-xs font-medium text-secondary shadow-sm ring-1 ring-black/5 backdrop-blur">
            <MapPin aria-hidden className="size-3.5 text-fg-brand-primary" />
            {t(tour.area)}
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pt-4 pb-5">
        <h3 className="text-lg leading-snug font-semibold tracking-tight text-primary">
          <Link
            href={href}
            className="line-clamp-2 after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none group-focus-within:underline"
          >
            {t(tour.title)}
          </Link>
        </h3>
        {tour.summary && (
          <p className="line-clamp-2 text-sm leading-relaxed text-tertiary">{tour.summary}</p>
        )}
        <ul className="mt-auto flex flex-col gap-2 pt-1 text-sm text-secondary">
          <li className="flex items-start gap-2.5">
            <IconDot>
              <Calendar aria-hidden className="size-3.5" />
            </IconDot>
            {next ? (
              <span>
                {t("Próxima salida: {date} a las {time}", {
                  date: formatDateShort(next.startsAt, locale),
                  time: formatTime(next.startsAt, locale),
                })}
                {fewSeats && (
                  <span className="font-medium text-error-primary">
                    {" "}
                    · {t("quedan {n} plazas", { n: next.seatsLeft })}
                  </span>
                )}
              </span>
            ) : (
              <span>{t("Nuevas fechas próximamente")}</span>
            )}
          </li>
          {minutes !== null && minutes > 0 && (
            <li className="flex items-center gap-2.5">
              <IconDot>
                <Clock aria-hidden className="size-3.5" />
              </IconDot>
              <span>{formatDuration(minutes)}</span>
            </li>
          )}
          {tour.meetingPoint && (
            <li className="flex items-center gap-2.5">
              <IconDot>
                <MapPin aria-hidden className="size-3.5" />
              </IconDot>
              <span className="line-clamp-1">
                <span className="sr-only">{t("Punto de encuentro")}: </span>
                {tour.meetingPoint}
              </span>
            </li>
          )}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-4 bg-brand-solid px-5 py-4 text-white transition-colors duration-200 group-hover:bg-brand-solid_hover motion-reduce:transition-none">
        <span aria-hidden className="inline-flex items-center gap-2 text-base font-semibold">
          {t("Ver viaje")}
          <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
        </span>
        {price !== null && (
          <span className="flex flex-col items-end leading-none">
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase">
              {t("Desde")}
            </span>
            <span className="mt-1 text-xl font-semibold tracking-tight">
              {formatPrice(price, locale)}
              <span className="text-sm font-medium"> / {t("persona")}</span>
            </span>
          </span>
        )}
      </div>
    </article>
  );
}

function IconDot({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-fg-brand-primary">
      {children}
    </span>
  );
}
