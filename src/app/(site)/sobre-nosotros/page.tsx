import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { RichText } from "@/components/content/rich-text";
import { WhyTripcelona, GroupsBanner } from "@/components/home/landing";
import { HowItWorks } from "@/components/home/alive";
import { JsonLd } from "@/components/seo/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, HeroIntro } from "@/components/motion/reveal";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getPageBySlug } from "@/lib/content/queries";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { getSiteContent } from "@/lib/site-content";
import { getSiteSettings } from "@/lib/settings";
import { destinations } from "@/lib/site";
import { getPublishedTours } from "@/lib/tours/queries";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("sobre-nosotros");
  return {
    title: page?.seoTitle ?? "Sobre nosotros",
    description:
      page?.seoDescription ??
      "Conoce Tripcelona: excursiones de un día desde Barcelona con guía, transporte y reserva sencilla.",
    alternates: { canonical: "/sobre-nosotros" },
  };
}

export default function AboutPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AboutBody />
    </Suspense>
  );
}

async function AboutBody() {
  const [tours, page, site, { home }] = await Promise.all([
    getPublishedTours(),
    getPageBySlug("sobre-nosotros"),
    getSiteSettings(),
    getSiteContent(),
  ]);
  const photos = tours.flatMap((t) => (t.image ? [t.image] : []));
  const photo = (i: number) => photos[i % Math.max(photos.length, 1)] ?? null;
  const hero = photo(0);
  const circle = photo(4);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Sobre nosotros", path: "/sobre-nosotros" },
        ])}
      />

      <header className="relative overflow-hidden bg-secondary">
        <div className="container-site grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <HeroIntro>
            <p
              data-intro
              className="text-[13px] font-medium tracking-[0.03em] text-brand-secondary"
            >
              01/ Sobre nosotros
            </p>
            <h1
              data-intro
              className="mt-4 text-4xl leading-[1.08] font-semibold tracking-[-0.035em] text-primary md:text-[3.25rem]"
            >
              Descubre Cataluña y Aragón en un día
            </h1>
            <p data-intro className="mt-5 max-w-lg text-lg text-tertiary">
              Tripcelona organiza excursiones de un día desde Barcelona: salimos de un punto de
              encuentro, vamos en autocar y con guía, y volvemos por la tarde sin que tengas que
              planificar nada.
            </p>
            <div data-intro className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/ofertas-de-viajes" size="lg">
                Ver excursiones
              </ButtonLink>
              <ButtonLink href="/contactanos" size="lg" variant="outline">
                Contacta con nosotros
              </ButtonLink>
            </div>
          </HeroIntro>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-brand-primary ring-1 ring-secondary ring-inset lg:rounded-l-[3rem]">
            {hero && (
              <Image
                src={hero.url}
                alt={hero.alt}
                fill
                priority
                sizes="(min-width: 1128px) 560px, 100vw"
                className="object-cover"
              />
            )}
          </div>
        </div>
      </header>

      <section
        aria-labelledby="historia-heading"
        className="rounded-t-[2.5rem] bg-primary py-16 md:py-24"
      >
        <div className="container-site grid items-center gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-14">
          <div>
            <p className="text-[13px] font-medium tracking-[0.03em] text-brand-secondary">
              02/ Quiénes somos
            </p>
            <h2
              id="historia-heading"
              className="mt-3 text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]"
            >
              Viajar sin complicaciones
            </h2>
            <div className="mt-6 text-tertiary">
              {page ? (
                <RichText doc={page.content} tokens={{}} />
              ) : (
                <p className="text-lg">
                  Reservas online, pagas con tarjeta y te presentas en el punto de encuentro.
                  Nosotros nos ocupamos del transporte, la visita y el horario.
                </p>
              )}
            </div>
            <ButtonLink href="/ofertas-de-viajes" size="lg" className="mt-8">
              Elegir excursión
            </ButtonLink>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-full bg-brand-primary ring-1 ring-secondary ring-inset lg:w-[26rem] lg:max-w-none">
            {circle && (
              <Image
                src={circle.url}
                alt={circle.alt}
                fill
                sizes="(min-width: 1128px) 416px, 384px"
                className="object-cover"
              />
            )}
          </div>
          <Reveal>
            <dl className="divide-y divide-secondary">
              {[
                { v: tours.length, l: "Excursiones de un día" },
                { v: destinations.length, l: "Destinos en Cataluña y Aragón" },
                {
                  v: tours.flatMap((t) => t.departures.filter((d) => d.status === "open")).length,
                  l: "Salidas abiertas ahora",
                },
              ].map((s) => (
                <div key={s.l} data-reveal className="py-5 first:pt-0 lg:text-right">
                  <dt className="text-md text-tertiary">{s.l}</dt>
                  <dd className="mt-1 text-5xl font-semibold tracking-[-0.035em] text-primary">
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <WhyTripcelona photo={photo(1)} title={home.whyTitle} reasons={home.reasons} />
      <HowItWorks title={home.stepsTitle} steps={home.steps} />
      <GroupsBanner
        photo={photo(2)}
        phoneHref={site.phoneHref}
        phoneDisplay={site.phoneDisplay}
        title={home.groupsTitle}
        groupPoints={home.groupPoints}
      />
    </>
  );
}
