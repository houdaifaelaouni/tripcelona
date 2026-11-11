import type { Metadata } from "next";
import { Bus, Check, Clock, MapPin, Mountain, Timer, X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import { DeparturePicker } from "@/components/booking/departure-picker";
import { RichText } from "@/components/content/rich-text";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, faqJsonLd, tourJsonLd } from "@/lib/seo/json-ld";
import { WhatsAppCta } from "@/components/tours/empty-state";
import { Gallery } from "@/components/tours/gallery";
import { TourCard } from "@/components/tours/tour-card";
import { Accordion } from "@/components/ui/accordion";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/lib/site";
import {
  departureMinutes,
  formatDateLong,
  formatDuration,
  formatPrice,
  formatTime,
} from "@/lib/tours/format";
import { getLiveDepartures } from "@/lib/booking/queries";
import { getPublishedTours, getTourBySlug, getTourSlugs, relatedTours } from "@/lib/tours/queries";
import type { TourDetail } from "@/lib/tours/types";

// Cache Components needs at least one param at build time; "_" renders the
// 404 page when there are no published tours yet (fresh database).
const NONE = "_";

export async function generateStaticParams() {
  const slugs = await getTourSlugs();
  return (slugs.length ? slugs : [NONE]).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/excursiones/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound(); // before streaming starts, so unknown slugs get a real 404 status
  return {
    title: tour.seoTitle ?? tour.title,
    description:
      tour.seoDescription ??
      `${tour.title}. Excursión de un día en grupo desde Barcelona${tour.area ? ` a ${tour.area}` : ""}.`,
    alternates: { canonical: `/excursiones/${tour.slug}` },
    openGraph: {
      title: tour.seoTitle ?? tour.title,
      url: `/excursiones/${tour.slug}`,
      images: tour.image ? [{ url: tour.image.url, alt: tour.image.alt }] : undefined,
    },
  };
}

/**
 * `params` is read inside Suspense: when a cache tag used by the layout is
 * invalidated, Next re-prerenders the route shell with fallback params, and
 * awaiting them outside a boundary fails that render (500 on every slug).
 */
export default function TourPage({ params }: PageProps<"/excursiones/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TourPageBody params={params} />
    </Suspense>
  );
}

async function TourPageBody({ params }: { params: PageProps<"/excursiones/[slug]">["params"] }) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();
  const related = relatedTours(await getPublishedTours(), tour);
  const next = tour.departures.find((d) => d.status === "open") ?? null;

  return (
    <article className="pt-6 md:pt-8">
      <JsonLd
        data={[
          tourJsonLd(tour),
          breadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: "Ofertas de viajes", path: "/ofertas-de-viajes" },
            { name: tour.title, path: `/excursiones/${tour.slug}` },
          ]),
          ...(faqJsonLd(tour.faqs) ? [faqJsonLd(tour.faqs)!] : []),
        ]}
      />
      <div className="container-detail">
        <nav aria-label="Ruta de navegación" className="text-meta text-muted">
          <ol className="flex flex-wrap gap-1">
            <li>
              <Link href="/" className="underline-offset-2 hover:underline">
                Inicio
              </Link>{" "}
              /
            </li>
            <li>
              <Link href="/ofertas-de-viajes" className="underline-offset-2 hover:underline">
                Ofertas de viajes
              </Link>{" "}
              /
            </li>
            <li aria-current="page" className="text-ink">
              {tour.area ?? tour.title}
            </li>
          </ol>
        </nav>

        <header className="mt-3">
          <h1 className="text-display-lg md:text-display-xl">{tour.title}</h1>
          {tour.area && (
            <p className="mt-1 flex items-center gap-1 text-meta text-muted">
              <MapPin aria-hidden size={16} />
              {tour.area} · salida desde Barcelona
            </p>
          )}
        </header>

        <Gallery images={tour.images} title={tour.title} />

        <div className="mt-8 grid gap-x-16 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 divide-y divide-border">
            <div className="pb-8">
              <KeyFacts tour={tour} />
              {tour.summary && <p className="mt-6 text-base">{tour.summary}</p>}
            </div>

            {tour.description && tour.description.content.length > 0 && (
              <Section title="La excursión">
                <RichText doc={tour.description} />
              </Section>
            )}

            {tour.highlights.length > 0 && (
              <Section title="Lo más destacado">
                <List items={tour.highlights} kind="yes" columns />
              </Section>
            )}

            {tour.itinerary.length > 0 && (
              <Section title="Itinerario">
                <ol className="divide-y divide-border">
                  {tour.itinerary.map((step, i) => (
                    <li key={`${i}-${step.title}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <span
                        aria-hidden
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-alt text-meta font-semibold"
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        {step.timeLabel && (
                          <p className="text-caption font-semibold text-muted">{step.timeLabel}</p>
                        )}
                        <h3 className="text-base">{step.title}</h3>
                        {step.body && <p className="mt-1 text-meta text-muted">{step.body}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {(tour.inclusions.length > 0 || tour.exclusions.length > 0) && (
              <div className="grid gap-x-8 sm:grid-cols-2">
                {tour.inclusions.length > 0 && (
                  <Section title="Incluye">
                    <List items={tour.inclusions} kind="yes" />
                  </Section>
                )}
                {tour.exclusions.length > 0 && (
                  <Section title="No incluye">
                    <List items={tour.exclusions} kind="no" />
                  </Section>
                )}
              </div>
            )}

            {tour.packingList.length > 0 && (
              <Section title="Qué llevar">
                <List items={tour.packingList} kind="dot" />
              </Section>
            )}

            <Section title="Punto de encuentro">
              <p>{tour.meetingPoint ?? site.meetingPoint}</p>
              {next && (
                <p className="mt-1 text-meta text-muted">
                  Salida a las {formatTime(next.startsAt)}.
                </p>
              )}
              <a
                href={tour.mapUrl ?? site.meetingPointMapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block font-semibold underline underline-offset-2"
              >
                Ver en Google Maps
              </a>
            </Section>

            {tour.faqs.length > 0 && (
              <Section title="Preguntas frecuentes">
                <Accordion
                  items={tour.faqs.map((f, i) => ({
                    id: String(i),
                    title: f.question,
                    content: f.answer,
                  }))}
                />
              </Section>
            )}
          </div>

          <aside
            id="reservar"
            aria-label="Reserva"
            className="scroll-mt-24 border-t border-border pt-8 lg:sticky lg:top-28 lg:self-start lg:border-0 lg:pt-0"
          >
            <BookingPanel tour={tour} />
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <section
          aria-labelledby="related-heading"
          className="container-detail mt-16 border-t border-border py-16"
        >
          <h2 id="related-heading" className="text-display-lg">
            Otras excursiones
          </h2>
          <ul className="mt-8 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => (
              <li key={t.slug} className="flex">
                <TourCard tour={t} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <MobileBookingBar tour={tour} />
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-8">
      <h2 className="mb-4 text-display-sm">{title}</h2>
      {children}
    </section>
  );
}

function List({
  items,
  kind,
  columns = false,
}: {
  items: string[];
  kind: "yes" | "no" | "dot";
  columns?: boolean;
}) {
  return (
    <ul className={columns ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          {kind === "yes" && (
            <Check aria-hidden size={20} className="mt-0.5 shrink-0 text-success" />
          )}
          {kind === "no" && <X aria-hidden size={20} className="mt-0.5 shrink-0 text-danger" />}
          {kind === "dot" && (
            <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink" />
          )}
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Mobile only: price and a jump to the dates, stuck to the bottom while the tour is in view. */
function MobileBookingBar({ tour }: { tour: TourDetail }) {
  const price = tour.departures.find((d) => d.status === "open")?.priceCents ?? tour.priceFromCents;
  return (
    <div className="sticky bottom-0 z-30 mt-8 border-t border-border bg-white lg:hidden">
      <div className="container-detail flex items-center justify-between gap-4 py-3">
        <p>
          {price !== null ? (
            <>
              <span className="text-meta text-muted">Desde </span>
              <span className="font-semibold">{formatPrice(price)}</span>
              <span className="text-meta text-muted"> / persona</span>
            </>
          ) : (
            <span className="text-meta text-muted">Nuevas fechas próximamente</span>
          )}
        </p>
        <ButtonLink href="#reservar" size="md">
          Ver fechas
        </ButtonLink>
      </div>
    </div>
  );
}

function KeyFacts({ tour }: { tour: TourDetail }) {
  const next = tour.departures[0];
  const minutes = tour.durationMinutes ?? (next ? departureMinutes(next) : null);
  const facts = [
    { icon: MapPin, label: "Zona", value: tour.area },
    {
      icon: Clock,
      label: "Horario",
      value: next
        ? `Salida ${formatTime(next.startsAt)}${next.endsAt ? ` · regreso aprox. ${formatTime(next.endsAt)}` : ""}`
        : null,
    },
    { icon: Timer, label: "Duración", value: minutes ? formatDuration(minutes) : null },
    { icon: Mountain, label: "Dificultad", value: tour.difficulty },
    { icon: Bus, label: "Salida desde", value: "Estació del Nord, Barcelona" },
  ].filter((f): f is typeof f & { value: string } => Boolean(f.value));

  return (
    <dl className="grid gap-5 sm:grid-cols-2">
      {facts.map(({ icon: Icon, label, value }) => (
        <div key={label} className="relative pl-10">
          <dt className="text-meta text-muted">
            <Icon aria-hidden size={24} strokeWidth={1.5} className="absolute top-1 left-0" />
            {label}
          </dt>
          <dd className="font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function BookingPanel({ tour }: { tour: TourDetail }) {
  const price = tour.departures.find((d) => d.status === "open")?.priceCents ?? tour.priceFromCents;
  return (
    <div className="rounded-card border border-border bg-white p-6 shadow-float">
      {price !== null && (
        <p>
          <span className="text-meta text-muted">Desde </span>
          <span className="text-display-lg font-semibold">{formatPrice(price)}</span>
          <span className="text-meta text-muted"> / persona</span>
        </p>
      )}
      {/* Seats are read live per request; the cached list shows meanwhile. */}
      <Suspense fallback={<CachedDates tour={tour} />}>
        <LiveAvailability tour={tour} />
      </Suspense>
    </div>
  );
}

async function LiveAvailability({ tour }: { tour: TourDetail }) {
  const departures = (await getLiveDepartures(tour.slug)).slice(0, 8);
  const bookable = departures.some((d) => d.status === "open" && d.seatsLeft > 0);
  if (!bookable) return <NoDates tour={tour} soldOut={departures.length > 0} />;
  return <DeparturePicker departures={departures} />;
}

function CachedDates({ tour }: { tour: TourDetail }) {
  if (tour.departures.length === 0) return <NoDates tour={tour} soldOut={false} />;
  return (
    <ul className="mt-4 divide-y divide-border text-meta" aria-busy="true">
      {tour.departures.slice(0, 8).map((d) => (
        <li key={d.id} className="py-3 first-letter:uppercase">
          {formatDateLong(d.startsAt)}
        </li>
      ))}
    </ul>
  );
}

function NoDates({ tour, soldOut }: { tour: TourDetail; soldOut: boolean }) {
  return (
    <div className="mt-4">
      <p className="text-muted">
        {soldOut
          ? "Todas las fechas publicadas están completas."
          : "Estamos preparando nuevas fechas para esta excursión."}{" "}
        Escríbenos y te avisamos de la próxima salida.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <WhatsAppCta
          label="Avísame por WhatsApp"
          message={`Hola, me interesa la excursión "${tour.title}". ¿Cuándo es la próxima salida?`}
        />
        <Link
          href="/ofertas-de-viajes"
          className="text-center font-semibold underline underline-offset-2"
        >
          Ver otras excursiones
        </Link>
      </div>
    </div>
  );
}
