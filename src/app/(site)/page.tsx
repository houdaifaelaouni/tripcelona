import { Hero } from "@/components/home/hero";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { TourCard } from "@/components/tours/tour-card";
import { getPublishedTours } from "@/lib/tours/queries";
import { getSiteSettings } from "@/lib/settings";
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

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <Hero />
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
        <ul className="mt-12 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {bySoonest.map((tour) => (
            <li key={tour.slug} className="flex">
              <TourCard tour={tour} />
            </li>
          ))}
        </ul>
      </section>
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
