import { CustomTours } from "@/components/home/custom-tours";
import { FeatureStrip } from "@/components/home/feature-strip";
import { Hero } from "@/components/home/hero";
import { Reviews } from "@/components/home/reviews";
import { ContactSection, GroupsCta, SectionHeader, WhyUs } from "@/components/home/sections";
import { DestinationsMap } from "@/components/home/alive";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { TourCard } from "@/components/tours/tour-card";
import { ButtonLink } from "@/components/ui/button";
import { getApprovedReviews } from "@/lib/reviews/queries";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { getSiteSettings } from "@/lib/settings";
import { getPublishedTours } from "@/lib/tours/queries";
import type { TourImage } from "@/lib/tours/types";

/**
 * Home page: hero, benefits strip, next departures, custom tours, why us,
 * destinations map, groups band, approved reviews and contact. All content
 * comes from the catalog and settings; nothing is hard-coded per tour.
 */
export default async function Home() {
  const [tours, site, reviews] = await Promise.all([
    getPublishedTours(),
    getSiteSettings(),
    getApprovedReviews(6),
  ]);

  const bySoonest = [...tours].sort(
    (a, b) =>
      (a.departures[0] ? Date.parse(a.departures[0].startsAt) : Infinity) -
      (b.departures[0] ? Date.parse(b.departures[0].startsAt) : Infinity),
  );
  const cards = bySoonest.slice(0, 6);
  const heroImage = cards[0]?.gallery?.[0] ?? cards[0]?.image ?? null;

  // One photo per tour, in departure order, for the collage and the band.
  const photos: TourImage[] = [];
  for (const tour of bySoonest) {
    for (const image of tour.gallery ?? (tour.image ? [tour.image] : [])) {
      if (photos.length >= 4) break;
      if (!photos.some((p) => p.url === image.url)) photos.push(image);
    }
    if (photos.length >= 4) break;
  }

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <Hero image={heroImage} />
      <FeatureStrip />

      <section aria-labelledby="proximas-heading" className="container-site py-16 md:py-24">
        <SectionHeader
          id="proximas-heading"
          eyebrow="Próximas salidas"
          title="Viajes"
          lead="Elige destino y fecha: transporte, guía y organización incluidos."
          action={
            <ButtonLink href="/ofertas-de-viajes" variant="outline">
              Ver todos los viajes
            </ButtonLink>
          }
        />
        <Reveal>
          <ul className="mt-12 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((tour, i) => (
              <li key={tour.slug} data-reveal className="flex">
                <TourCard tour={tour} priority={i < 3} />
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <CustomTours image={photos[3] ?? photos[0] ?? null} />
      <WhyUs photos={photos} />
      <DestinationsMap />
      <GroupsCta whatsappHref={site.whatsappHref} />
      <Reviews reviews={reviews} />
      <ContactSection
        phoneHref={site.phoneHref}
        phoneDisplay={site.phoneDisplay}
        whatsappHref={site.whatsappHref}
      />
    </>
  );
}
