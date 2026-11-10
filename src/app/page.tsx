import { Hero } from "@/components/home/hero";
import { ButtonLink } from "@/components/ui/button";
import { TourCard } from "@/components/tours/tour-card";
import { getPublishedTours } from "@/lib/tours/queries";

// TODO(PO): hero video (tripcelona-hero-pirineo.mp4, re-encoded ≤ 6 MB) and a
// poster image are needed from the owner; until then the hero shows the brand
// gradient. Pass them as <Hero videoSrc posterSrc /> once uploaded to Storage.
export default async function Home() {
  const tours = await getPublishedTours();
  const bySoonest = [...tours].sort(
    (a, b) =>
      (a.departures[0] ? Date.parse(a.departures[0].startsAt) : Infinity) -
      (b.departures[0] ? Date.parse(b.departures[0].startsAt) : Infinity),
  );

  return (
    <>
      <Hero />
      <section aria-labelledby="proximas-heading" className="container-site py-12">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="proximas-heading" className="text-2xl md:text-3xl">
            Próximas salidas
          </h2>
          <ButtonLink href="/ofertas-de-viajes" variant="ghost">
            Ver todas las ofertas
          </ButtonLink>
        </div>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bySoonest.map((tour) => (
            <li key={tour.slug} className="flex">
              <TourCard tour={tour} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
