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
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CoachArt, GroupArt, HikerArt } from "@/components/art/art";
import { buttonClasses } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/motion/reveal";
import { destinations, site } from "@/lib/site";
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

/** Split hero: promise and two CTAs left, photo with the next-departure card right. */
export function LandingHero({
  photo,
  next,
  fromCents,
}: {
  photo: { url: string; alt: string } | null;
  next: NextTrip;
  fromCents: number | null;
}) {
  return (
    <section aria-labelledby="home-heading" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--color-border-tertiary)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border-tertiary)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_80%_70%_at_20%_0%,black,transparent)]"
      />
      <div className="container-site grid items-center gap-12 py-12 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-primary py-1 pr-3 pl-1 text-xs font-medium text-secondary ring-1 ring-secondary ring-inset">
            <span className="rounded-full bg-brand-primary px-2 py-0.5 text-brand-secondary">
              Cada domingo
            </span>
            {fromCents !== null
              ? `Excursiones desde ${formatPrice(fromCents)} por persona`
              : "Salidas desde Estació del Nord"}
          </p>
          <h1
            id="home-heading"
            className="mt-6 text-[2.5rem] leading-[1.06] font-semibold tracking-[-0.035em] text-primary md:text-6xl md:leading-[1.04]"
          >
            Excursiones de un día desde Barcelona
          </h1>
          <p className="mt-5 max-w-xl text-lg text-tertiary md:text-xl md:leading-relaxed">
            El Pirineo, los volcanes de la Garrotxa y pueblos medievales de Cataluña. Tú eliges
            destino; nosotros ponemos el autocar, el guía y la logística.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#tours-heading" className={buttonClasses({ size: "lg" })}>
              Ver próximas salidas
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link
              href="/crea-tu-tour"
              className={buttonClasses({ variant: "outline", size: "lg" })}
            >
              <Users aria-hidden className="size-4" />
              Viajes para grupos
            </Link>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-secondary pt-6 text-sm text-secondary">
            {trust.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5">
                <Icon aria-hidden className="size-4 shrink-0 text-fg-brand-primary" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="rounded-2xl bg-secondary p-2 ring-1 ring-secondary ring-inset">
            <div
              data-art-host
              className="relative aspect-[4/3] overflow-hidden rounded-xl bg-tertiary lg:aspect-[5/6]"
            >
              {!photo && <CoachArt className="absolute inset-0 size-full" />}
              {photo && (
                <Image
                  src={photo.url}
                  alt={photo.alt}
                  fill
                  priority
                  sizes="(min-width: 1128px) 560px, 100vw"
                  className="object-cover"
                />
              )}
            </div>
          </div>
          {next && <NextTripCard next={next} />}
        </div>
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
      className="group relative z-10 mx-4 -mt-16 flex items-center gap-4 rounded-xl bg-primary p-4 shadow-lg ring-1 ring-secondary transition-shadow hover:shadow-xl sm:mx-auto sm:max-w-md lg:absolute lg:-bottom-6 lg:-left-10 lg:mx-0 lg:mt-0 lg:w-[360px]"
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

/** Logo-strip layout, used for destinations. */
export function DestinationStrip() {
  return (
    <section aria-labelledby="destinos-strip" className="border-y border-secondary bg-secondary">
      <div className="container-site flex flex-col gap-4 py-6 md:flex-row md:items-center md:gap-8">
        <h2 id="destinos-strip" className="shrink-0 text-sm font-medium text-tertiary">
          Nuestros destinos
        </h2>
        <ul className="flex flex-wrap gap-x-6 gap-y-3">
          {destinations.map((d) => (
            <li key={d.area}>
              <Link
                href={catalogHref({ zona: d.area })}
                className="inline-flex items-center gap-1.5 text-md font-semibold tracking-tight text-secondary hover:text-brand-secondary"
              >
                <MapPin aria-hidden className="size-4 text-fg-quaternary" />
                {d.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Stats row (kit "Stats V1"): four real figures over hairline dividers. */
export function StatsRow({ tours }: { tours: TourSummary[] }) {
  const open = tours.flatMap((t) => t.departures.filter((d) => d.status === "open"));
  const from = minPriceCents(tours);
  const stats = [
    { value: String(tours.length), label: "Excursiones de un día" },
    { value: String(destinations.length), label: "Destinos en Cataluña y Aragón" },
    { value: String(open.length), label: "Salidas abiertas ahora" },
    ...(from !== null ? [{ value: formatPrice(from), label: "Precio desde, por persona" }] : []),
  ];
  return (
    <section aria-label="Tripcelona en cifras" className="container-site py-14 md:py-20">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border-secondary ring-1 ring-secondary lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse gap-1 bg-primary p-6 md:p-8">
            <dt className="text-sm text-tertiary">{s.label}</dt>
            <dd className="text-4xl font-semibold tracking-[-0.035em] text-primary md:text-5xl">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const reasons = [
  {
    icon: Bus,
    title: "Sin coche ni aparcamiento",
    body: "Autocar de ida y vuelta desde el centro de Barcelona.",
  },
  {
    icon: UserCheck,
    title: "Guía local",
    body: "Te acompaña durante toda la excursión y conoce cada rincón.",
  },
  {
    icon: MapPin,
    title: "Salida céntrica",
    body: `Quedamos en ${site.meetingPoint}.`,
  },
  {
    icon: CalendarCheck,
    title: "Vuelves el mismo día",
    body: "Salidas en domingo, con regreso a Barcelona por la tarde.",
  },
  {
    icon: CreditCard,
    title: "Reserva en dos minutos",
    body: "Pago seguro con tarjeta y confirmación por email al momento.",
  },
  {
    icon: Users,
    title: "También para grupos",
    body: "Empresas, colegios o amigos: preparamos un tour a medida.",
  },
];

/** Content section (image + feature list). */
export function WhyTripcelona({ photo }: { photo: { url: string; alt: string } | null }) {
  return (
    <section aria-labelledby="por-que-heading" className="border-t border-secondary py-16 md:py-24">
      <div className="container-site grid items-center gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div
          data-art-host
          className="relative order-last aspect-[4/5] overflow-hidden rounded-2xl bg-brand-primary ring-1 ring-secondary ring-inset lg:order-first"
        >
          {!photo && <HikerArt className="absolute inset-0 size-full object-cover" />}
          {photo && (
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(min-width: 1128px) 520px, 100vw"
              className="object-cover"
            />
          )}
          {photo && (
            <div className="absolute bottom-4 left-4 w-44 rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-secondary">
              <HikerArt />
            </div>
          )}
        </div>
        <div>
          <SectionHeader
            id="por-que-heading"
            eyebrow="Por qué Tripcelona"
            title="Tú disfrutas del día, nosotros nos ocupamos del resto"
          />
          <Reveal>
            <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {reasons.map(({ icon: Icon, title, body }) => (
                <li key={title} data-reveal className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-fg-brand-primary ring-1 ring-brand-200/60 ring-inset">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-md font-semibold tracking-tight text-primary">{title}</h3>
                    <p className="mt-1 text-sm text-tertiary">{body}</p>
                  </div>
                </li>
              ))}
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

const groupPoints = [
  "Fecha y destino a vuestra medida",
  "Autocar y guía para todo el grupo",
  "Presupuesto sin compromiso",
];

/** Call to action (dark panel + photo) for group trips. */
export function GroupsBanner({
  photo,
  whatsappHref,
}: {
  photo: { url: string; alt: string } | null;
  whatsappHref: string;
}) {
  return (
    <section aria-labelledby="grupos-heading" className="container-site pb-16 md:pb-24">
      <div className="grid overflow-hidden rounded-2xl bg-primary-solid text-white lg:grid-cols-[1.2fr_1fr]">
        <div className="p-8 md:p-12 lg:p-14">
          <p className="text-[13px] font-medium tracking-[0.03em] text-brand-300">
            Empresas, colegios y amigos
          </p>
          <h2
            id="grupos-heading"
            className="mt-3 text-3xl leading-[1.15] font-semibold tracking-[-0.03em] md:text-[2.5rem]"
          >
            ¿Organizas una salida en grupo?
          </h2>
          <ul className="mt-6 space-y-2.5 text-md text-white/80">
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
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses(
                { size: "lg" },
                "bg-white/10 text-white ring-white/20 hover:bg-white/15",
              )}
            >
              <WhatsAppIcon />
              WhatsApp
            </a>
          </div>
        </div>
        <div
          data-art-host
          className="relative hidden min-h-72 items-center justify-center bg-neutral-800 p-8 lg:flex"
        >
          {photo && (
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="520px"
              className="object-cover opacity-30"
            />
          )}
          <div className="relative w-full max-w-[300px] rounded-3xl bg-white p-2 shadow-xl">
            <GroupArt />
          </div>
        </div>
      </div>
    </section>
  );
}
