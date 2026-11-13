import type { Metadata } from "next";
import { DeparturesTable, HowItWorks } from "@/components/home/alive";
import {
  AnnouncementBar,
  DestinationStrip,
  findNextTrip,
  GroupsBanner,
  HomeFaq,
  LandingHero,
  minPriceCents,
  StatsRow,
  WhyTripcelona,
} from "@/components/home/landing";
import { ContactSection } from "@/components/home/sections";
import { Testimonials } from "@/components/home/testimonials";
import { getApprovedReviews, getPublishedFaqs } from "@/lib/content/queries";
import { getSiteSettings } from "@/lib/settings";
import { getSiteContent } from "@/lib/site-content";
import { TourCard } from "@/components/tours/tour-card";
import { ButtonLink } from "@/components/ui/button";
import { getPublishedTours } from "@/lib/tours/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { home } = await getSiteContent();
  return { title: home.seoTitle, description: home.seoDescription, alternates: { canonical: "/" } };
}

export default async function Home() {
  const [tours, faqs, reviews, site, { home }] = await Promise.all([
    getPublishedTours(),
    getPublishedFaqs().catch(() => []),
    getApprovedReviews().catch(() => []),
    getSiteSettings(),
    getSiteContent(),
  ]);
  const photos = tours.flatMap((tour) => (tour.image ? [tour.image] : []));
  const photo = (i: number) => photos[i % Math.max(photos.length, 1)] ?? null;
  const next = findNextTrip(tours);
  const bySoonest = [...tours].sort(
    (a, b) =>
      (a.departures[0] ? Date.parse(a.departures[0].startsAt) : Infinity) -
      (b.departures[0] ? Date.parse(b.departures[0].startsAt) : Infinity),
  );

  return (
    <>
      <AnnouncementBar next={next} />
      <LandingHero
        photo={photo(0)}
        next={next}
        fromCents={minPriceCents(tours)}
        title={home.heroTitle}
        lead={home.heroLead}
      />
      <DestinationStrip />

      <section aria-labelledby="tours-heading" className="container-site py-16 md:py-24">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[13px] font-medium tracking-[0.03em] text-brand-secondary">
              Próximas salidas
            </p>
            <h2
              id="tours-heading"
              className="mt-3 scroll-mt-24 text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]"
            >
              Elige tu próxima excursión
            </h2>
            <p className="mt-4 text-lg text-tertiary">
              {bySoonest.length === 1
                ? "1 excursión de un día con salida desde Barcelona."
                : `${bySoonest.length} excursiones de un día con salida desde Barcelona.`}
            </p>
          </div>
          <ButtonLink href="/ofertas-de-viajes" variant="outline">
            Ver todas las ofertas
          </ButtonLink>
        </div>
        {bySoonest.length === 0 ? (
          <div className="rounded-xl bg-secondary px-6 py-12 text-center ring-1 ring-secondary ring-inset">
            <h3 className="text-lg font-semibold text-primary">
              Estamos preparando nuevas salidas
            </h3>
            <p className="mt-2 text-tertiary">
              Vuelve pronto para descubrir nuestros próximos viajes.
            </p>
          </div>
        ) : (
          <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
            {bySoonest.map((tour, index) => (
              <li key={tour.slug} className="flex">
                <TourCard tour={tour} priority={index < 2} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <StatsRow tours={tours} />
      <WhyTripcelona photo={photo(1)} title={home.whyTitle} reasons={home.reasons} />
      <HowItWorks title={home.stepsTitle} steps={home.steps} />
      <DeparturesTable tours={tours} />
      <Testimonials reviews={reviews} />
      <GroupsBanner
        photo={photo(2)}
        whatsappHref={site.whatsappHref}
        title={home.groupsTitle}
        groupPoints={home.groupPoints}
      />
      <HomeFaq faqs={faqs.slice(0, 6)} whatsappHref={site.whatsappHref} />
      <ContactSection
        phoneHref={site.phoneHref}
        phoneDisplay={site.phoneDisplay}
        whatsappHref={site.whatsappHref}
      />
    </>
  );
}
