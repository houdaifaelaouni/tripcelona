import { Hero } from "@/components/home/hero";

// TODO(PO): hero video (tripcelona-hero-pirineo.mp4, re-encoded ≤ 6 MB) and a
// poster image are needed from the owner; until then the hero shows the brand
// gradient. Pass them as <Hero videoSrc posterSrc /> once uploaded to Storage.
export default function Home() {
  return (
    <>
      <Hero />
      <section className="container-site py-12">
        <h2 className="text-2xl">Próximas salidas</h2>
        <p className="mt-2 text-muted">Las fichas de las excursiones llegan en el Sprint 4.</p>
      </section>
    </>
  );
}
