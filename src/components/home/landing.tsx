/*
 * Conversion home page sections, laid out after the owner's wireframe kit
 * (top notification bar, split hero, logo strip, stats, content section,
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
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/motion/reveal";
import { destinations } from "@/lib/site";
import { catalogHref } from "@/lib/tours/filters";
import { dateParts, formatDateLong, formatPrice, formatTime } from "@/lib/tours/format";
import type { Departure, TourSummary } from "@/lib/tours/types";
import { SectionHeader } from "./sections";

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
export function AnnouncementBar({ next }: { next: NextTrip }) {
  if (!next) return null;
  const { tour, departure } = next;
  return (
    <div className="border-b border-brand-100 bg-brand-primary text-sm text-brand-secondary">
      <p className="container-site flex min-h-10 flex-wrap items-center justify-center gap-x-2 gap-y-1 py-2 text-center">
        <span className="font-semibold">Próxima salida:</span>
        <span className="first-letter:uppercase">{formatDateLong(departure.startsAt)}</span>
        <span aria-hidden>·</span>
        <span>{tour.title}</span>
        {departure.seatsLeft <= 15 && (
          <span className="font-semibold">· quedan {departure.seatsLeft} plazas</span>
        )}
        <Link
          href={`/excursiones/${tour.slug}`}
          className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:text-brand-secondary_hover"
        >
          Reservar
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
];

/**
 * Full-bleed hero: a background video (when the owner sets one in the admin,
 * and the visitor has not asked for reduced motion) over the tour photo, which
 * is always the first paint so the video never blocks the page. The text sits
 * on a dark gradient for AA contrast; the next-departure card floats right.
 */
export function LandingHero({
  photo,
  videoSrc,
  next,
  fromCents,
  title,
  lead,
}: {
  photo: { url: string; alt: string } | null;
  videoSrc?: string;
  next: NextTrip;
  fromCents: number | null;
  title: string;
  lead: string;
}) {
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
          <source
            src={videoSrc}
            type={videoSrc.toLowerCase().includes(".webm") ? "video/webm" : "video/mp4"}
          />
        </video>
      )}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/25"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink/70 to-transparent"
      />
      <div className="container-site grid min-h-[600px] items-end gap-10 pt-24 pb-14 md:min-h-[680px] md:pb-20 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pr-3 pl-1 text-xs font-medium ring-1 ring-white/25 backdrop-blur ring-inset">
            <span className="rounded-full bg-white px-2 py-0.5 text-ink">Cada domingo</span>
            {fromCents !== null
              ? `Excursiones desde ${formatPrice(fromCents)} por persona`
              : "Salidas desde Estació del Nord"}
          </p>
          <h1
            id="home-heading"
            className="mt-6 text-[2.5rem] leading-[1.06] font-semibold tracking-[-0.035em] md:text-6xl md:leading-[1.04]"
          >
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/90 md:text-xl md:leading-relaxed">
            {lead}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#tours-heading"
              className={buttonClasses({ size: "lg" }, "bg-white text-ink hover:bg-white/90")}
            >
              Ver próximas salidas
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
              Viajes para grupos
            </Link>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/20 pt-6 text-sm text-white/90 sm:max-w-xl">
            {trust.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5">
                <Icon aria-hidden className="size-4 shrink-0 text-white" />
                {label}
              </li>
            ))}
          </ul>
        </div>
        {next && (
          <div className="lg:justify-self-end">
            <NextTripCard next={next} />
          </div>
        )}
      </div>
    </section>
  );
}

function NextTripCard({ next }: { next: NonNullable<NextTrip> }) {
  const { tour, departure } = next;
  const date = dateParts(departure.startsAt);
  return (
    <Link
      href={`/excursiones/${tour.slug}`}
      className="group relative z-10 flex w-full max-w-md items-center gap-4 rounded-xl bg-primary p-4 text-primary shadow-lg ring-1 ring-secondary transition-shadow hover:shadow-xl lg:w-[360px]"
    >
      <span className="flex min-w-14 flex-col items-center rounded-lg bg-brand-primary px-2 py-1.5 text-center text-brand-secondary">
        <span className="text-[11px] font-medium tracking-[0.06em] uppercase">{date.month}</span>
        <span className="text-xl leading-6 font-semibold">{date.day}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-quaternary">
          Próxima salida · {formatTime(departure.startsAt)}
        </span>
        <span className="mt-0.5 line-clamp-1 block text-sm font-semibold text-primary">
          {tour.title}
        </span>
        <span className="mt-0.5 block text-sm text-tertiary">
          {formatPrice(departure.priceCents)} ·{" "}
          {departure.seatsLeft === 1 ? "1 plaza libre" : `${departure.seatsLeft} plazas libres`}
        </span>
      </span>
      <ArrowRight
        aria-hidden
        className="size-5 shrink-0 text-fg-quaternary transition-transform group-hover:translate-x-0.5 group-hover:text-fg-brand-primary"
      />
    </Link>
  );
}

/** Destination tiles: one photo per destination, from the tours that go there. */
export function DestinationStrip({
  photos,
}: {
  photos: Record<string, { url: string; alt: string } | null>;
}) {
  return (
    <section aria-labelledby="destinos-strip" className="container-site py-14 md:py-20">
      <p className="text-[13px] font-medium tracking-[0.03em] text-brand-secondary">Destinos</p>
      <h2
        id="destinos-strip"
        className="mt-3 text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]"
      >
        Nuestros destinos
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
                  <span className="relative flex items-center gap-1.5 p-4 text-md leading-snug font-semibold tracking-tight text-white">
                    <MapPin aria-hidden className="size-4 shrink-0" />
                    {d.label}
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

/** Stats band: four real figures over a full-width landscape photo. */
export function StatsRow({
  tours,
  photo,
}: {
  tours: TourSummary[];
  photo: { url: string; alt: string } | null;
}) {
  const open = tours.flatMap((t) => t.departures.filter((d) => d.status === "open"));
  const from = minPriceCents(tours);
  const stats = [
    { value: String(tours.length), label: "Excursiones de un día" },
    { value: String(destinations.length), label: "Destinos en Cataluña y Aragón" },
    { value: String(open.length), label: "Salidas abiertas ahora" },
    ...(from !== null ? [{ value: formatPrice(from), label: "Precio desde, por persona" }] : []),
  ];
  return (
    <section
      aria-label="Tripcelona en cifras"
      className="relative isolate overflow-hidden bg-ink text-white"
    >
      {photo && <Image src={photo.url} alt="" fill sizes="100vw" className="-z-20 object-cover" />}
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink/65" />
      <div className="container-site py-16 md:py-24">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col-reverse gap-1 border-l border-white/30 pl-5"
            >
              <dt className="text-sm text-white/85">{s.label}</dt>
              <dd className="text-4xl font-semibold tracking-[-0.035em] md:text-5xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const reasonIcons = [Bus, UserCheck, MapPin, CalendarCheck, CreditCard, Users];

/** Content section (image + feature list). */
export function WhyTripcelona({
  photo,
  title,
  reasons,
}: {
  photo: { url: string; alt: string } | null;
  title: string;
  reasons: { title: string; body: string }[];
}) {
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
        </div>
        <div>
          <SectionHeader id="por-que-heading" eyebrow="Por qué Tripcelona" title={title} />
          <Reveal>
            <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {reasons.map(({ title, body }, i) => {
                const Icon = reasonIcons[i % reasonIcons.length];
                return (
                  <li key={title} data-reveal className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-fg-brand-primary ring-1 ring-brand-200/60 ring-inset">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-md font-semibold tracking-tight text-primary">{title}</h3>
                      <p className="mt-1 text-sm text-tertiary">{body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>
          <Link href="/ofertas-de-viajes" className={buttonClasses({ size: "lg" }, "mt-10")}>
            Elegir excursión
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
}: {
  faqs: { id: string; question: string; answer: string }[];
  whatsappHref: string;
}) {
  if (faqs.length === 0) return null;
  return (
    <section aria-labelledby="faq-heading" className="border-t border-secondary py-16 md:py-24">
      <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div>
          <SectionHeader
            id="faq-heading"
            eyebrow="Preguntas frecuentes"
            title="Antes de reservar"
            lead="Lo que más nos preguntan sobre las excursiones."
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link
              href="/preguntas-frecuentes"
              className={buttonClasses({ variant: "outline", size: "lg" })}
            >
              Ver todas las preguntas
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "ghost", size: "lg" })}
            >
              <WhatsAppIcon />
              Pregúntanos
            </a>
          </div>
        </div>
        <div className="divide-y divide-secondary border-y border-secondary">
          {faqs.map((f) => (
            <details key={f.id} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md py-4 text-md font-semibold text-primary [&::-webkit-details-marker]:hidden">
                {f.question}
                <ChevronDown
                  aria-hidden
                  className="size-5 shrink-0 text-fg-quaternary transition-transform group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="pb-5 text-md whitespace-pre-line text-tertiary">{f.answer}</p>
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
}: {
  photo: { url: string; alt: string } | null;
  phoneHref: string;
  phoneDisplay: string;
  title: string;
  groupPoints: string[];
}) {
  return (
    <section
      aria-labelledby="grupos-heading"
      className="relative isolate overflow-hidden bg-ink text-white"
    >
      {photo && <Image src={photo.url} alt="" fill sizes="100vw" className="-z-20 object-cover" />}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/65 to-ink/30"
      />
      <div className="container-site py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="text-[13px] font-medium tracking-[0.03em] text-brand-300">
            Empresas, colegios y amigos
          </p>
          <h2
            id="grupos-heading"
            className="mt-3 text-3xl leading-[1.15] font-semibold tracking-[-0.03em] md:text-[2.5rem]"
          >
            {title}
          </h2>
          <ul className="mt-6 space-y-2.5 text-md text-white/90">
            {groupPoints.map((p) => (
              <li key={p} className="flex items-center gap-2.5">
                <Check aria-hidden className="size-4 shrink-0 text-brand-300" />
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/crea-tu-tour" className={buttonClasses({ size: "lg" })}>
              Pedir presupuesto
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
