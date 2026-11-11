import { Hero } from "@/components/home/hero";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { TourCard } from "@/components/tours/tour-card";
import { getPublishedTours } from "@/lib/tours/queries";
import { getSiteSettings } from "@/lib/settings";
import { DeparturesTable, DestinationsMap, HowItWorks, Stats } from "@/components/home/alive";
import { Reveal } from "@/components/motion/reveal";
import { PhotoGallery, type GalleryPhoto } from "@/components/home/photo-gallery";
import { ContactSection, GroupsCta, SectionHeader, WhyUs } from "@/components/home/sections";

// TODO(PO): hero video (tripcelona-hero-pirineo.mp4, re-encoded ≤ 6 MB) and a
// poster image are needed from the owner; until then the hero shows the brand
// gradient. Pass them as <Hero videoSrc posterSrc /> once uploaded to Storage.
export default async function Home() {
  const [tours, site] = await Promise.all([getPublishedTours(), getSiteSettings()]);
  const bySoonest = [...tours].sort(
    (a, b) =>
      (a.departures[0] ? Date.parse(a.departures[0].startsAt) : Infinity) -
      (b.departures[0] ? Date.parse(b.departures[0].startsAt) : Infinity),
  );

  // Round-robin through tours so the gallery mixes destinations.
  const photos: GalleryPhoto[] = [];
  const lists = tours.map((t) =>
    (t.gallery ?? (t.image ? [t.image] : [])).map((img) => ({ t, img })),
  );
  for (let i = 0; photos.length < 12 && lists.some((l) => l[i]); i++) {
    for (const l of lists) {
      const item = l[i];
      if (item && photos.length < 12) {
        photos.push({
          url: item.img.url,
          alt: item.img.alt,
          title: item.t.title,
          area: item.t.area,
          href: `/excursiones/${item.t.slug}`,
        });
      }
    }
  }

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <Hero />
      <Stats tours={tours} />
      <section aria-labelledby="proximas-heading" className="container-site py-16 md:py-24">
        <SectionHeader
          id="proximas-heading"
          eyebrow="Calendario"
          title="Próximas salidas"
          lead="Reserva tu plaza online en pocos minutos."
          action={
            <ButtonLink href="/ofertas-de-viajes" variant="outline">
              Ver todas las ofertas
            </ButtonLink>
          }
        />
        <Reveal>
          <ul className="mt-12 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {bySoonest.map((tour) => (
              <li key={tour.slug} data-reveal className="flex">
                <TourCard tour={tour} />
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
      <DeparturesTable tours={tours} />
      <HowItWorks />
      {photos.length > 0 && (
        <section aria-labelledby="galeria-heading" className="overflow-hidden py-16 md:py-24">
          <div className="container-site">
            <SectionHeader
              id="galeria-heading"
              eyebrow="Galería"
              title="Así son nuestras excursiones"
              lead="Desliza para ver fotos de cada destino. Toca una para ver la excursión."
            />
          </div>
          <div className="mt-10">
            <PhotoGallery photos={photos} />
          </div>
        </section>
      )}
      <DestinationsMap />
      <GroupsCta whatsappHref={site.whatsappHref} />
      <WhyUs />
      <ContactSection
        phoneHref={site.phoneHref}
        phoneDisplay={site.phoneDisplay}
        whatsappHref={site.whatsappHref}
      />
    </>
  );
}
