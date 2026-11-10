import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import { DeparturePicker } from "@/components/booking/departure-picker";
import { RichText } from "@/components/content/rich-text";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, faqJsonLd, tourJsonLd } from "@/lib/seo/json-ld";
import { WhatsAppCta } from "@/components/tours/empty-state";
import { TourCard } from "@/components/tours/tour-card";
import { Accordion } from "@/components/ui/accordion";
import { Badge, Card } from "@/components/ui/card";
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

export async function generateStaticParams() {
  return (await getTourSlugs()).map((slug) => ({ slug }));
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
    <article className="container-site py-6 md:py-10">
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
      <nav aria-label="Ruta de navegación" className="text-sm text-muted">
        <ol className="flex flex-wrap gap-1">
          <li>
            <Link href="/" className="hover:underline">
              Inicio
            </Link>{" "}
            /
          </li>
          <li>
            <Link href="/ofertas-de-viajes" className="hover:underline">
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
        {tour.area && <Badge tone="brand">{tour.area}</Badge>}
        <h1 className="mt-2 text-2xl md:text-4xl">{tour.title}</h1>
      </header>

      <Gallery tour={tour} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-10">
          <KeyFacts tour={tour} />
          {tour.summary && <p className="text-lg">{tour.summary}</p>}
          {tour.description && tour.description.content.length > 0 && (
            <Section title="La excursión">
              <RichText doc={tour.description} />
            </Section>
          )}

          {tour.highlights.length > 0 && (
            <Section title="Lo más destacado">
              <ul className="grid gap-2 sm:grid-cols-2">
                {tour.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span aria-hidden className="text-success">
                      ✓
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {tour.itinerary.length > 0 && (
            <Section title="Itinerario">
              <ol className="relative space-y-6 border-l-2 border-blue/30 pl-6">
                {tour.itinerary.map((step, i) => (
                  <li key={`${i}-${step.title}`} className="relative">
                    <span
                      aria-hidden
                      className="absolute top-0.5 -left-[33px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-blue"
                    />
                    {step.timeLabel && (
                      <p className="text-sm font-bold text-blue">{step.timeLabel}</p>
                    )}
                    <h3 className="text-base">{step.title}</h3>
                    {step.body && <p className="mt-1 text-muted">{step.body}</p>}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            {tour.inclusions.length > 0 && (
              <Section title="Incluye">
                <List items={tour.inclusions} mark="✓" markClass="text-success" />
              </Section>
            )}
            {tour.exclusions.length > 0 && (
              <Section title="No incluye">
                <List items={tour.exclusions} mark="✕" markClass="text-danger" />
              </Section>
            )}
          </div>

          {tour.packingList.length > 0 && (
            <Section title="Qué llevar">
              <List items={tour.packingList} mark="•" markClass="text-blue" />
            </Section>
          )}

          <Section title="Punto de encuentro">
            <p>{tour.meetingPoint ?? site.meetingPoint}</p>
            {next && <p className="mt-1 text-muted">Salida a las {formatTime(next.startsAt)}.</p>}
            <a
              href={tour.mapUrl ?? site.meetingPointMapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-bold text-blue hover:underline"
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

        <aside className="order-first lg:sticky lg:top-20 lg:order-none lg:self-start">
          <BookingPanel tour={tour} />
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-14">
          <h2 id="related-heading" className="text-2xl">
            Otras excursiones
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => (
              <li key={t.slug} className="flex">
                <TourCard tour={t} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl">{title}</h2>
      {children}
    </section>
  );
}

function List({ items, mark, markClass }: { items: string[]; mark: string; markClass: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden className={markClass}>
            {mark}
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Gallery({ tour }: { tour: TourDetail }) {
  const [main, ...rest] = tour.images;
  if (!main) return null;
  const thumbs = rest.slice(0, 4);
  return (
    <div className="mt-4 grid gap-2 md:grid-cols-4 md:grid-rows-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface-alt md:col-span-2 md:row-span-2 md:aspect-auto">
        <Image
          src={main.url}
          alt={main.alt}
          fill
          priority
          sizes="(min-width: 768px) 570px, 100vw"
          className="object-cover"
        />
      </div>
      {thumbs.map((img) => (
        <div
          key={img.url}
          className="relative hidden aspect-[4/3] overflow-hidden rounded-card bg-surface-alt md:block"
        >
          <Image src={img.url} alt={img.alt} fill sizes="285px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

function KeyFacts({ tour }: { tour: TourDetail }) {
  const next = tour.departures[0];
  const minutes = tour.durationMinutes ?? (next ? departureMinutes(next) : null);
  const facts = [
    { label: "Zona", value: tour.area },
    {
      label: "Horario",
      value: next
        ? `Salida ${formatTime(next.startsAt)}${next.endsAt ? ` · regreso aprox. ${formatTime(next.endsAt)}` : ""}`
        : null,
    },
    { label: "Duración", value: minutes ? formatDuration(minutes) : null },
    { label: "Dificultad", value: tour.difficulty },
    { label: "Salida desde", value: "Estació del Nord, Barcelona" },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  return (
    <dl className="grid grid-cols-2 gap-4 rounded-panel bg-surface-alt p-4 sm:grid-cols-3">
      {facts.map((f) => (
        <div key={f.label}>
          <dt className="text-sm text-muted">{f.label}</dt>
          <dd className="font-bold">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function BookingPanel({ tour }: { tour: TourDetail }) {
  const price = tour.departures.find((d) => d.status === "open")?.priceCents ?? tour.priceFromCents;
  return (
    <Card className="p-5">
      {price !== null && (
        <p>
          <span className="text-sm text-muted">Desde </span>
          <span className="text-3xl font-bold">{formatPrice(price)}</span>
          <span className="text-sm text-muted"> / persona</span>
        </p>
      )}
      {/* Seats are read live per request; the cached list shows meanwhile. */}
      <Suspense fallback={<CachedDates tour={tour} />}>
        <LiveAvailability tour={tour} />
      </Suspense>
    </Card>
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
    <ul className="mt-4 divide-y divide-border" aria-busy="true">
      {tour.departures.slice(0, 8).map((d) => (
        <li key={d.id} className="py-2 first-letter:uppercase">
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
        <Link href="/ofertas-de-viajes" className="text-center font-bold text-blue hover:underline">
          Ver otras excursiones
        </Link>
      </div>
    </div>
  );
}
