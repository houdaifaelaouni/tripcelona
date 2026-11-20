/*
 * Conversion home page sections, laid out after the owner's wireframe kit
 * (top notification bar, split hero, logo strip, content section,
 * accordion and call-to-action layouts). Every number and date comes from
 * published tours; no reviews or figures are invented.
 */
import {
  ArrowRight,
  Bus,
  CalendarCheck,
  Check,
  ChevronDown,
  CreditCard,
  MailCheck,
  MapPin,
  Phone,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
import { PhotoCredit } from "@/components/ui/photo-credit";
import type { PhotoCredit as PhotoCreditData } from "@/lib/photos/library";
import type { TourImage } from "@/lib/tours/types";
import Link from "@/components/i18n/link";
import { buttonClasses } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/motion/reveal";
import { createT } from "@/lib/i18n/translate";
import type { Locale } from "@/lib/i18n/config";
import { destinations } from "@/lib/site";
import { catalogHref } from "@/lib/tours/filters";
import { dateParts, formatDateLong, formatPrice, formatTime } from "@/lib/tours/format";
import type { Departure, TourSummary } from "@/lib/tours/types";
import { SectionHeader } from "./sections";
import { ReasonsMotion } from "./reasons-motion";
import { TicketMotion } from "./ticket-motion";

export type NextTrip = { tour: TourSummary; departure: Departure } | null;

/** The soonest open departure across all tours. */
export function findNextTrip(tours: TourSummary[]): NextTrip {
  let best: NextTrip = null;
  for (const tour of tours) {
    for (const departure of tour.departures) {
      if (departure.status !== "open" || departure.seatsLeft <= 0) continue;
      if (!best || Date.parse(departure.startsAt) < Date.parse(best.departure.startsAt)) {
        best = { tour, departure };
      }
    }
  }
  return best;
}

export function minPriceCents(tours: TourSummary[]): number | null {
  const prices = tours.map((t) => t.priceFromCents).filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

/** Top notification bar: the next departure and its seats left. */
export function AnnouncementBar({ next, locale }: { next: NextTrip; locale: Locale }) {
  if (!next) return null;
  const t = createT(locale);
  const { tour, departure } = next;
  return (
    <div className="hidden border-b border-brand-100 bg-brand-primary text-sm text-brand-secondary md:block">
      <p className="container-site flex min-h-10 flex-wrap items-center justify-center gap-x-2 gap-y-1 py-2 text-center">
        <span className="font-semibold">{t("Próxima salida:")}</span>
        <span className="first-letter:uppercase">{formatDateLong(departure.startsAt, locale)}</span>
        <span aria-hidden>·</span>
        <span>{tour.title}</span>
        {departure.seatsLeft <= 15 && (
          <span className="font-semibold">
            · {t("quedan {n} plazas", { n: departure.seatsLeft })}
          </span>
        )}
        <Link
          href={`/excursiones/${tour.slug}`}
          className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:text-brand-secondary_hover"
        >
          {t("Reservar")}
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </p>
    </div>
  );
}

const trust = [
  { icon: Bus, label: "Autocar ida y vuelta" },
  { icon: UserCheck, label: "Guía local todo el día" },
  { icon: ShieldCheck, label: "Pago seguro con tarjeta" },
  { icon: MailCheck, label: "Confirmación inmediata" },
] as const;

/**
 * Full-bleed hero: a background video (when the owner sets one in the admin,
 * and the visitor has not asked for reduced motion) over the tour photo, which
 * is always the first paint so the video never blocks the page. The text sits
 * on a dark gradient for AA contrast; the next-departure card floats right.
 */
export function LandingHero({
  photo,
  videoSrc,
  videoSrcMobile,
  videoCredit,
  next,
  fromCents,
  title,
  lead,
  locale,
}: {
  locale: Locale;
  photo: TourImage | null;
  videoSrc?: string;
  /** Smaller file for phones; only used with the library video. */
  videoSrcMobile?: string;
  /** Credit shown for the background video. */
  videoCredit?: PhotoCreditData;
  next: NextTrip;
  fromCents: number | null;
  title: string;
  lead: string;
}) {
  const t = createT(locale);
  return (
    <section
      aria-labelledby="home-heading"
      className="relative isolate overflow-hidden bg-ink text-white"
    >
      {photo ? (
        <Image src={photo.url} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
      ) : null}
      {videoSrc && (
        <video
          className="absolute inset-0 -z-20 size-full object-cover motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          data-no-motion
        >
          {videoSrcMobile && (
            <source src={videoSrcMobile} type="video/mp4" media="(max-width: 767px)" />
          )}
          <source
            src={videoSrc}
            type={videoSrc.toLowerCase().includes(".webm") ? "video/webm" : "video/mp4"}
          />
        </video>
      )}
      <PhotoCredit credit={videoSrc ? (videoCredit ?? photo?.credit) : photo?.credit} />
      <div className="container-site grid min-h-[600px] items-end gap-10 pt-24 pb-14 md:min-h-[680px] md:pb-20 lg:grid-cols-[1.4fr_1fr]">
        {/* No dark overlay on the photo: a text shadow keeps the white copy readable. */}
        <div className="[text-shadow:0_1px_3px_rgb(0_0_0/0.6),0_2px_20px_rgb(0_0_0/0.45)]">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pr-3 pl-1 text-xs font-medium ring-1 ring-white/25 backdrop-blur ring-inset">
            <span className="rounded-full bg-white px-2 py-0.5 text-ink [text-shadow:none]">
              {t("Cada domingo")}
            </span>
            {fromCents !== null
              ? t("Excursiones desde {price} por persona", {
                  price: formatPrice(fromCents, locale),
                })
              : t("Salidas desde Estació del Nord")}
          </p>
          <h1
            id="home-heading"
            className="mt-6 text-[2.5rem] leading-[1.06] font-semibold tracking-[-0.035em] md:text-6xl md:leading-[1.04]"
          >
            {t(title)}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/90 md:text-xl md:leading-relaxed">
            {t(lead)}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#tours-heading"
              className={buttonClasses(
                { size: "lg" },
                "bg-white text-ink [text-shadow:none] hover:bg-white/90",
              )}
            >
              {t("Ver próximas salidas")}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link
              href="/crea-tu-tour"
              className={buttonClasses(
                { size: "lg" },
                "bg-white/10 text-white ring-white/30 backdrop-blur hover:bg-white/20",
              )}
            >
              <Users aria-hidden className="size-4" />
              {t("Viajes para grupos")}
            </Link>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/20 pt-6 text-sm text-white/90 sm:max-w-xl">
            {trust.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5">
                <Icon aria-hidden className="size-4 shrink-0 text-white" />
                {t(label)}
              </li>
            ))}
          </ul>
        </div>
        {next && (
          <div className="lg:justify-self-end">
            <NextTripCard next={next} locale={locale} />
          </div>
        )}
      </div>
    </section>
  );
}

/** Round notches cut into both edges at the perforation (9rem = photo height). */
const TICKET_NOTCH_MASK = [
  "radial-gradient(circle 11px at 0 9rem, #0000 98%, #000) left / 51% 100% no-repeat",
  "radial-gradient(circle 11px at 100% 9rem, #0000 98%, #000) right / 51% 100% no-repeat",
].join(", ");

function NextTripCard({ next, locale }: { next: NonNullable<NextTrip>; locale: Locale }) {
  const t = createT(locale);
  const { tour, departure } = next;
  const date = dateParts(departure.startsAt, locale);
  const photo = tour.image ?? tour.gallery?.[0] ?? null;
  return (
    // Drop shadow lives on the wrapper: the notch mask would clip a box-shadow.
    <TicketMotion className="relative z-10 w-full max-w-md drop-shadow-[0_10px_18px_rgb(0_0_0/0.22)] lg:w-[360px]">
      <Link
        href={`/excursiones/${tour.slug}`}
        className="group block overflow-hidden rounded-2xl bg-primary text-primary"
        style={{ mask: TICKET_NOTCH_MASK, WebkitMask: TICKET_NOTCH_MASK }}
      >
        <span data-ticket-photo className="relative block h-36 overflow-hidden bg-ink">
          {photo && (
            <Image
              src={photo.url}
              alt={photo.alt || tour.title}
              fill
              sizes="(min-width: 1024px) 360px, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
            />
          )}
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent"
          />
          <span className="absolute top-3 left-3 flex min-w-14 flex-col items-center rounded-lg bg-white/95 px-2 py-1.5 text-center text-brand-secondary shadow-sm">
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase">
              {date.month}
            </span>
            <span className="text-xl leading-6 font-semibold">{date.day}</span>
          </span>
          <span className="absolute right-3 bottom-3 rounded-full bg-yellow px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
            {formatPrice(departure.priceCents, locale)}
          </span>
        </span>
        <span aria-hidden className="relative block px-5">
          <span data-ticket-perf className="block border-t-2 border-dashed border-secondary" />
        </span>
        <span data-ticket-stub className="flex items-center gap-4 px-5 pt-3 pb-4">
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-quaternary">
              {t("Próxima salida")} · {formatTime(departure.startsAt, locale)}
            </span>
            <span className="mt-0.5 line-clamp-2 block text-sm font-semibold text-primary">
              {tour.title}
            </span>
            <span className="mt-0.5 block text-sm text-tertiary">
              {departure.seatsLeft === 1
                ? t("1 plaza libre")
                : t("{n} plazas libres", { n: departure.seatsLeft })}
            </span>
          </span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-yellow text-ink transition-transform group-hover:translate-x-0.5">
            <ArrowRight aria-hidden className="size-4" />
          </span>
        </span>
      </Link>
    </TicketMotion>
  );
}

/** Destination tiles: one photo per destination, from the tours that go there. */
export function DestinationStrip({
  photos,
  locale,
}: {
  photos: Record<string, TourImage | null>;
  locale: Locale;
}) {
  const t = createT(locale);
  return (
    <section aria-labelledby="destinos-strip" className="container-site py-14 md:py-20">
      <p className="text-[13px] font-medium tracking-[0.03em] text-brand-secondary">
        {t("Destinos")}
      </p>
      <h2
        id="destinos-strip"
        className="mt-3 text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]"
      >
        {t("Nuestros destinos")}
      </h2>
      <Reveal>
        <ul className="mt-8 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
          {destinations.map((d) => {
            const photo = photos[d.area];
            return (
              <li key={d.area} data-reveal>
                <Link
                  href={catalogHref({ zona: d.area })}
                  className="group relative flex aspect-[3/4] items-end overflow-hidden rounded-2xl bg-ink ring-1 ring-secondary ring-inset"
                >
                  {photo ? (
                    <Image
                      src={photo.url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 20vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                    />
                  ) : null}
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent"
                  />
                  <PhotoCredit
                    credit={photo?.credit}
                    link={false}
                    className="top-2 right-2 bottom-auto max-w-[90%] text-[9px]"
                  />
                  <span className="relative flex items-center gap-1.5 p-4 text-md leading-snug font-semibold tracking-tight text-white">
                    <MapPin aria-hidden className="size-4 shrink-0" />
                    {t(d.label)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}

const reasonIcons = [Bus, UserCheck, MapPin, CalendarCheck, CreditCard, Users];

/** Content section (image + feature list). */
/** Brand palette cycled over the reason cards: navy, cyan, yellow. */
const reasonTones = [
  { tile: "bg-blue text-white", bar: "bg-blue" },
  { tile: "bg-cyan text-white", bar: "bg-cyan" },
  { tile: "bg-yellow text-ink", bar: "bg-yellow" },
];

export function WhyTripcelona({
  photo,
  title,
  reasons,
  locale,
}: {
  photo: TourImage | null;
  title: string;
  reasons: { title: string; body: string }[];
  locale: Locale;
}) {
  const t = createT(locale);
  return (
    <section aria-labelledby="por-que-heading" className="border-t border-secondary py-16 md:py-24">
      <div className="container-site grid items-center gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div className="relative order-last aspect-[4/5] overflow-hidden rounded-2xl bg-brand-primary ring-1 ring-secondary ring-inset lg:order-first">
          {photo && (
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(min-width: 1128px) 520px, 100vw"
              className="object-cover"
            />
          )}
          <PhotoCredit credit={photo?.credit} />
        </div>
        <div>
          <SectionHeader id="por-que-heading" eyebrow={t("Por qué Tripcelona")} title={t(title)} />
          <ReasonsMotion className="mt-10 grid gap-4 sm:grid-cols-2">
            {reasons.map(({ title, body }, i) => {
              const Icon = reasonIcons[i % reasonIcons.length];
              const tone = reasonTones[i % reasonTones.length];
              return (
                <li
                  key={title}
                  data-reason
                  className="group relative flex gap-4 overflow-hidden rounded-xl bg-primary p-4 pl-5 ring-1 ring-secondary transition-shadow duration-200 ring-inset hover:shadow-md motion-reduce:transition-none"
                >
                  <span
                    aria-hidden
                    data-reason-bar
                    className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`}
                  />
                  {/* GSAP animates the outer tile; hover tilt lives on the inner one so
                      a CSS transform transition never fights the GSAP tween. */}
                  <span data-reason-icon className="shrink-0">
                    <span
                      className={`flex size-11 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transition-none ${tone.tile}`}
                    >
                      <Icon aria-hidden className="size-5" />
                    </span>
                  </span>
                  <div>
                    <h3 className="text-md font-semibold tracking-tight text-primary">
                      {t(title)}
                    </h3>
                    <p className="mt-1 text-sm text-tertiary">{t(body)}</p>
                  </div>
                </li>
              );
            })}
          </ReasonsMotion>
          <Link href="/ofertas-de-viajes" className={buttonClasses({ size: "lg" }, "mt-10")}>
            {t("Elegir excursión")}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Accordion layout: title and contact on the left, questions on the right. */
export function HomeFaq({
  faqs,
  whatsappHref,
  locale,
}: {
  faqs: { id: string; question: string; answer: string }[];
  whatsappHref: string;
  locale: Locale;
}) {
  if (faqs.length === 0) return null;
  const t = createT(locale);
  return (
    <section aria-labelledby="faq-heading" className="border-t border-secondary py-16 md:py-24">
      <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div>
          <SectionHeader
            id="faq-heading"
            eyebrow={t("Preguntas frecuentes")}
            title={t("Antes de reservar")}
            lead={t("Lo que más nos preguntan sobre las excursiones.")}
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link
              href="/preguntas-frecuentes"
              className={buttonClasses({ variant: "outline", size: "lg" })}
            >
              {t("Ver todas las preguntas")}
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "ghost", size: "lg" })}
            >
              <WhatsAppIcon />
              {t("Pregúntanos")}
            </a>
          </div>
        </div>
        <div className="divide-y divide-secondary border-y border-secondary">
          {faqs.map((f) => (
            <details key={f.id} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md py-4 text-md font-semibold text-primary [&::-webkit-details-marker]:hidden">
                {t(f.question)}
                <ChevronDown
                  aria-hidden
                  className="size-5 shrink-0 text-fg-quaternary transition-transform group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="pb-5 text-md whitespace-pre-line text-tertiary">{t(f.answer)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Call to action over a full-width photo, for group trips. */
export function GroupsBanner({
  photo,
  phoneHref,
  phoneDisplay,
  title,
  groupPoints,
  locale,
}: {
  photo: TourImage | null;
  phoneHref: string;
  phoneDisplay: string;
  title: string;
  groupPoints: string[];
  locale: Locale;
}) {
  const t = createT(locale);
  return (
    <section
      aria-labelledby="grupos-heading"
      className="relative isolate overflow-hidden bg-ink text-white"
    >
      {photo && <Image src={photo.url} alt="" fill sizes="100vw" className="-z-20 object-cover" />}
      <PhotoCredit credit={photo?.credit} />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/65 to-ink/30"
      />
      <div className="container-site py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="text-[13px] font-medium tracking-[0.03em] text-brand-300">
            {t("Empresas, colegios y amigos")}
          </p>
          <h2
            id="grupos-heading"
            className="mt-3 text-3xl leading-[1.15] font-semibold tracking-[-0.03em] md:text-[2.5rem]"
          >
            {t(title)}
          </h2>
          <ul className="mt-6 space-y-2.5 text-md text-white/90">
            {groupPoints.map((p) => (
              <li key={p} className="flex items-center gap-2.5">
                <Check aria-hidden className="size-4 shrink-0 text-brand-300" />
                {t(p)}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/crea-tu-tour" className={buttonClasses({ size: "lg" })}>
              {t("Pedir presupuesto")}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <a
              href={phoneHref}
              className={buttonClasses(
                { size: "lg" },
                "bg-white/10 text-white ring-white/30 backdrop-blur hover:bg-white/20",
              )}
            >
              <Phone aria-hidden className="size-4" />
              {phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
