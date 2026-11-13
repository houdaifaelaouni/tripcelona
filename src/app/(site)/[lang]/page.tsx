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
import { createT } from "@/lib/i18n/translate";
import { alternatesFor } from "@/lib/i18n/seo";
import { isLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { destinations } from "@/lib/site";
import { getSiteSettings } from "@/lib/settings";
import { getSiteContent } from "@/lib/site-content";
import { TourCard } from "@/components/tours/tour-card";
import { ButtonLink } from "@/components/ui/button";
import { getPublishedTours } from "@/lib/tours/queries";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(lang);
  const { home } = await getSiteContent();
  return {
    title: t(home.seoTitle),
    description: t(home.seoDescription),
    alternates: alternatesFor("/", lang),
  };
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang: locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = createT(locale);
  const [tours, faqs, reviews, site, { home }] = await Promise.all([
    getPublishedTours(locale),
    getPublishedFaqs(locale).catch(() => []),
    getApprovedReviews().catch(() => []),
    getSiteSettings(),
    getSiteContent(),
  ]);
  const photos = tours.flatMap((tour) => (tour.image ? [tour.image] : []));
  const photo = (i: number) => photos[i % Math.max(photos.length, 1)] ?? null;
  // One photo per destination, from the tours that go there.
  const areaPhotos = Object.fromEntries(
    destinations.map((d, i) => [
      d.area,
      tours.find((t) => t.areaSlug === d.area && t.image)?.image ?? photo(i),
    ]),
  );
  const next = findNextTrip(tours);
  const bySoonest = [...tours].sort(
    (a, b) =>
      (a.departures[0] ? Date.parse(a.departures[0].startsAt) : Infinity) -
      (b.departures[0] ? Date.parse(b.departures[0].startsAt) : Infinity),
  );

  return (
    <>
      <AnnouncementBar next={next} locale={locale} />
      <LandingHero
        locale={locale}
        photo={photo(0)}
        videoSrc={home.heroVideoUrl || undefined}
        next={next}
        fromCents={minPriceCents(tours)}
        title={home.heroTitle}
        lead={home.heroLead}
      />
      <DestinationStrip photos={areaPhotos} locale={locale} />

      <section aria-labelledby="tours-heading" className="container-site py-16 md:py-24">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[13px] font-medium tracking-[0.03em] text-brand-secondary">
              {t("Próximas salidas")}
            </p>
            <h2
              id="tours-heading"
              className="mt-3 scroll-mt-24 text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]"
            >
              {t("Elige tu próxima excursión")}
            </h2>
            <p className="mt-4 text-lg text-tertiary">
              {bySoonest.length === 1
                ? t("1 excursión de un día con salida desde Barcelona.")
                : t("{n} excursiones de un día con salida desde Barcelona.", {
                    n: bySoonest.length,
                  })}
            </p>
          </div>
          <ButtonLink href="/ofertas-de-viajes" variant="outline">
            {t("Ver todas las ofertas")}
          </ButtonLink>
        </div>
        {bySoonest.length === 0 ? (
          <div className="rounded-xl bg-secondary px-6 py-12 text-center ring-1 ring-secondary ring-inset">
            <h3 className="text-lg font-semibold text-primary">
              {t("Estamos preparando nuevas salidas")}
            </h3>
            <p className="mt-2 text-tertiary">
              {t("Vuelve pronto para descubrir nuestros próximos viajes.")}
            </p>
          </div>
        ) : (
          <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
            {bySoonest.map((tour, index) => (
              <li key={tour.slug} className="flex">
                <TourCard tour={tour} priority={index < 2} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <StatsRow tours={tours} photo={photo(3)} locale={locale} />
      <WhyTripcelona
        photo={photo(1)}
        title={home.whyTitle}
        reasons={home.reasons}
        locale={locale}
      />
      <HowItWorks title={home.stepsTitle} steps={home.steps} locale={locale} />
      <DeparturesTable tours={tours} locale={locale} />
      <Testimonials reviews={reviews} />
      <GroupsBanner
        photo={photo(2)}
        phoneHref={site.phoneHref}
        phoneDisplay={site.phoneDisplay}
        title={home.groupsTitle}
        groupPoints={home.groupPoints}
        locale={locale}
      />
      <HomeFaq faqs={faqs.slice(0, 6)} whatsappHref={site.whatsappHref} locale={locale} />
      <ContactSection
        phoneHref={site.phoneHref}
        phoneDisplay={site.phoneDisplay}
        whatsappHref={site.whatsappHref}
        locale={locale}
      />
    </>
  );
}
