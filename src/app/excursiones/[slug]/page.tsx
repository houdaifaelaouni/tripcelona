import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    openGraph: tour.image ? { images: [{ url: tour.image.url, alt: tour.image.alt }] } : undefined,
  };
}

export default async function TourPage({ params }: PageProps<"/excursiones/[slug]">) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();
  const related = relatedTours(await getPublishedTours(), tour);
  const next = tour.departures.find((d) => d.status === "open") ?? null;

  return (
    <article className="container-site py-6 md:py-10">
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

/** Read-only dates list. The interactive departure picker + checkout is Sprint 5 (US-16, US-18). */
function BookingPanel({ tour }: { tour: TourDetail }) {
  const upcoming = tour.departures.slice(0, 6);
  const price = upcoming.find((d) => d.status === "open")?.priceCents ?? tour.priceFromCents;
  return (
    <Card className="p-5">
      {price !== null && (
        <p>
          <span className="text-sm text-muted">Desde </span>
          <span className="text-3xl font-bold">{formatPrice(price)}</span>
          <span className="text-sm text-muted"> / persona</span>
        </p>
      )}
      <h2 className="mt-4 text-base">Próximas salidas</h2>
      {upcoming.length > 0 ? (
        <ul className="mt-2 divide-y divide-border">
          {upcoming.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 py-2">
              <span className="first-letter:uppercase">{formatDateLong(d.startsAt)}</span>
              {d.status === "sold_out" || d.seatsLeft === 0 ? (
                <Badge tone="danger">Completo</Badge>
              ) : (
                <span className="text-sm whitespace-nowrap text-muted">{d.seatsLeft} plazas</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-muted">Estamos preparando nuevas fechas para esta excursión.</p>
      )}
      <div className="mt-4 flex flex-col gap-2">
        <WhatsAppCta
          label="Reservar por WhatsApp"
          message={`Hola, quiero reservar la excursión "${tour.title}".`}
        />
      </div>
      <p className="mt-3 text-sm text-muted">La reserva online llega muy pronto.</p>
    </Card>
  );
}
