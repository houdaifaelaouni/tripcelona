/*
 * Extra home sections: "Cómo funciona" steps and the departures table. Untitled UI layouts (MIT, see
 * THIRD_PARTY_NOTICES.md), animated with GSAP via components/motion.
 * Every number comes from published tours; nothing is invented.
 */
import { CalendarCheck, CreditCard, MailCheck, Search } from "lucide-react";
import Link from "@/components/i18n/link";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/card";
import { createT } from "@/lib/i18n/translate";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/cn";
import {
  dateParts,
  formatDateShort,
  formatDuration,
  formatPrice,
  formatTime,
} from "@/lib/tours/format";
import type { TourSummary } from "@/lib/tours/types";
import { SectionHeader } from "./sections";

const stepIcons = [Search, CreditCard, MailCheck, CalendarCheck];

export function HowItWorks({
  title,
  steps,
  locale,
}: {
  title: string;
  steps: { title: string; body: string }[];
  locale: Locale;
}) {
  const t = createT(locale);
  return (
    <section aria-labelledby="como-heading" className="border-t border-secondary py-16 md:py-24">
      <div className="container-site">
        <div className="flex items-center justify-between gap-10">
          <SectionHeader
            id="como-heading"
            eyebrow={t("Cómo funciona")}
            title={t(title)}
            lead={t("Cuatro pasos y tu plaza está asegurada.")}
          />
        </div>
        <Reveal>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-xl bg-border-secondary ring-1 ring-secondary sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => {
              const Icon = stepIcons[i % stepIcons.length];
              return (
                <li key={s.title} data-reveal className="flex flex-col gap-6 bg-primary p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-brand-primary text-fg-brand-primary ring-1 ring-brand-200/60 ring-inset">
                      <Icon aria-hidden className="size-[18px]" />
                    </span>
                    <span className="font-mono text-xs text-quaternary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-md font-semibold tracking-tight text-primary">
                      {t(s.title)}
                    </h3>
                    <p className="mt-1.5 text-sm text-tertiary">{t(s.body)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

/** Half-circle punches on a ticket's tear line (the card clips the outer half). */
function Punches({ className }: { className?: string }) {
  const dot = "absolute size-4 rounded-full bg-primary ring-1 ring-secondary";
  return (
    <>
      {/* Stacked (mobile): the tear line is horizontal, punches left and right. */}
      <span aria-hidden className={`${dot} -bottom-2 -left-2 sm:hidden ${className ?? ""}`} />
      <span aria-hidden className={`${dot} -right-2 -bottom-2 sm:hidden ${className ?? ""}`} />
      {/* Side by side: the tear line is vertical, punches top and bottom. */}
      <span aria-hidden className={`${dot} -top-2 -right-2 hidden sm:block ${className ?? ""}`} />
      <span
        aria-hidden
        className={`${dot} -right-2 -bottom-2 hidden sm:block ${className ?? ""}`}
      />
    </>
  );
}

/** Upcoming departures as tickets: date stub, trip, price and seats, torn along a dashed line. */
export function DeparturesTable({ tours, locale }: { tours: TourSummary[]; locale: Locale }) {
  const t = createT(locale);
  const rows = tours
    .flatMap((tour) =>
      tour.departures.filter((d) => d.status !== "cancelled").map((d) => ({ tour, d })),
    )
    .sort((a, b) => Date.parse(a.d.startsAt) - Date.parse(b.d.startsAt))
    .slice(0, 8);
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby="calendario-heading" className="container-site pb-16 md:pb-24">
      <div className="flex items-center justify-between gap-10">
        <SectionHeader
          id="calendario-heading"
          eyebrow={t("Calendario")}
          title={t("Calendario de salidas")}
          lead={t("Fechas, plazas y precios de las próximas excursiones.")}
        />
      </div>
      <Reveal className="mt-10">
        <ul className="grid gap-4 lg:grid-cols-2">
          {rows.map(({ tour, d }) => {
            const full = d.status === "sold_out" || d.seatsLeft <= 0;
            const date = dateParts(d.startsAt, locale);
            return (
              <li key={d.id} data-reveal>
                <article
                  className={cn(
                    "relative grid overflow-hidden rounded-2xl bg-primary shadow-xs ring-1 ring-secondary transition-[box-shadow,transform] duration-200 ring-inset hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:grid-cols-[96px_minmax(0,1fr)_auto]",
                    full && "opacity-70",
                  )}
                >
                  {/* Date stub */}
                  <div className="relative flex items-center justify-between gap-3 border-b border-dashed border-primary bg-brand-primary_alt px-5 py-4 text-brand-secondary sm:flex-col sm:justify-center sm:border-r sm:border-b-0 sm:px-0">
                    <span className="text-[11px] font-semibold tracking-[0.08em] uppercase">
                      {date.month}
                    </span>
                    <span className="text-4xl leading-none font-semibold tracking-tight text-primary sm:text-[2.5rem]">
                      {date.day}
                    </span>
                    <span className="text-sm font-medium sm:mt-1">
                      {formatTime(d.startsAt, locale)}
                    </span>
                    <Punches />
                  </div>

                  {/* Trip */}
                  <div className="relative flex min-w-0 flex-col justify-center gap-1 border-b border-dashed border-primary px-5 py-4 sm:border-r sm:border-b-0">
                    <p className="text-xs font-medium text-quaternary">
                      <span className="first-letter:uppercase">
                        {formatDateShort(d.startsAt, locale)}
                      </span>
                      {tour.area ? ` · ${tour.area}` : ""}
                      {tour.durationMinutes ? ` · ${formatDuration(tour.durationMinutes)}` : ""}
                    </p>
                    <h3 className="text-base leading-snug font-semibold tracking-tight text-primary">
                      <Link
                        href={`/excursiones/${tour.slug}`}
                        className="after:absolute after:inset-0 hover:underline"
                      >
                        {tour.title}
                      </Link>
                    </h3>
                    <Punches />
                  </div>

                  {/* Price and seats */}
                  <div className="flex items-center justify-between gap-4 px-5 py-4 sm:min-w-36 sm:flex-col sm:items-end sm:justify-center sm:gap-2">
                    <p className="text-2xl font-semibold tracking-tight whitespace-nowrap text-primary">
                      {formatPrice(d.priceCents, locale)}
                    </p>
                    {full ? (
                      <Badge tone="danger">{t("Completo")}</Badge>
                    ) : d.seatsLeft <= 10 ? (
                      <Badge tone="accent">{t("Quedan {n}", { n: d.seatsLeft })}</Badge>
                    ) : (
                      <Badge tone="success">{t("{n} libres", { n: d.seatsLeft })}</Badge>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}
