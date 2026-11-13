import type { Metadata } from "next";
import { Check, CalendarCheck, HeartPulse, LifeBuoy, ShieldCheck, Star } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";
import { PhotoGallery, type GalleryPhoto } from "@/components/home/photo-gallery";
import { SectionHeader } from "@/components/home/sections";
import { JsonLd } from "@/components/seo/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { HeroIntro, Reveal } from "@/components/motion/reveal";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getPageBySlug } from "@/lib/content/queries";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { getSiteSettings } from "@/lib/settings";
import { getPublishedTours } from "@/lib/tours/queries";
import { createT } from "@/lib/i18n/translate";
import { alternatesFor } from "@/lib/i18n/seo";
import { isLocale, localizePath, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/sobre-nosotros">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(lang);
  const page = await getPageBySlug("sobre-nosotros", lang);
  return {
    title: page?.seoTitle ?? t("Sobre nosotros"),
    description:
      page?.seoDescription ??
      t(
        "Tripcelona organiza excursiones y viajes para grandes grupos desde Barcelona, con logística, transporte y soporte local.",
      ),
    alternates: alternatesFor("/sobre-nosotros", lang),
  };
}

const trust = [
  {
    icon: CalendarCheck,
    title: "Cancelación flexible para grupos",
    body: "Políticas claras y transparentes para grandes grupos. Te ofrecemos condiciones de cancelación flexibles adaptadas a las necesidades logísticas de vuestro número de viajeros.",
  },
  {
    icon: ShieldCheck,
    title: "Reserva 100% asegurada",
    body: "Proceso de pago seguro y cifrado para todas las transacciones. Tu inversión está protegida, y garantizamos la confirmación inmediata de todos los servicios.",
  },
  {
    icon: HeartPulse,
    title: "Salud y seguridad prioritaria",
    body: "Protocolos rigurosos y guías capacitados en primeros auxilios. Nos ocupamos del bienestar de cada uno de los miembros del grupo durante toda la aventura.",
  },
  {
    icon: Star,
    title: "Calidad y servicio de confianza",
    body: "Altamente valorados por nuestros clientes corporativos y de incentivos. Nuestro compromiso es con la excelencia en la gestión y ejecución de grandes eventos.",
  },
  {
    icon: LifeBuoy,
    title: "Asistencia local permanente",
    body: "Un equipo de apoyo dedicado en Barcelona para tu grupo. Soporte 24/7 y asistencia local inmediata ante cualquier imprevisto logístico o de coordinación.",
  },
];

const included = [
  "Alojamiento para grupos",
  "Experiencias de exploración exclusivas",
  "Planificación de viajes a medida",
  "Transporte privado incluido",
  "Recomendaciones locales genuinas",
  "Soporte logístico 24/7",
];

export default function AboutPage({ params }: PageProps<"/[lang]/sobre-nosotros">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AboutBody params={params} />
    </Suspense>
  );
}

async function AboutBody({ params }: { params: PageProps<"/[lang]/sobre-nosotros">["params"] }) {
  const { lang: locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = createT(locale);
  const [tours, site] = await Promise.all([getPublishedTours(locale), getSiteSettings()]);
  const photos = tours.flatMap((tour) => (tour.image ? [tour.image] : []));
  const photo = (i: number) => photos[i % Math.max(photos.length, 1)] ?? null;
  const gallery: GalleryPhoto[] = tours.flatMap((tour) =>
    tour.image
      ? [
          {
            url: tour.image.url,
            alt: tour.image.alt,
            title: tour.title,
            area: tour.area,
            href: `/excursiones/${tour.slug}`,
          },
        ]
      : [],
  );

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t("Inicio"), path: localizePath("/", locale) },
          { name: t("Sobre nosotros"), path: localizePath("/sobre-nosotros", locale) },
        ])}
      />

      <header className="bg-secondary">
        <div className="container-site grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <HeroIntro>
            <p
              data-intro
              className="text-[13px] font-medium tracking-[0.03em] text-brand-secondary"
            >
              {t("01/ Quiénes somos")}
            </p>
            <h1
              data-intro
              className="mt-4 text-4xl leading-[1.08] font-semibold tracking-[-0.035em] text-primary md:text-[3.25rem]"
            >
              {t("Viajar sin complicaciones")}
            </h1>
            <p data-intro className="mt-5 max-w-lg text-lg text-tertiary">
              {t("Viajar y explorar juntos: la logística de élite para tu gran grupo.")}
            </p>
            <div data-intro className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/crea-tu-tour" size="lg">
                {t("Pedir presupuesto")}
              </ButtonLink>
              <ButtonLink href="/ofertas-de-viajes" size="lg" variant="outline">
                {t("Ver excursiones")}
              </ButtonLink>
            </div>
          </HeroIntro>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-brand-primary ring-1 ring-secondary ring-inset lg:rounded-l-[3rem]">
            {photo(0) && (
              <Image
                src={photo(0)!.url}
                alt={photo(0)!.alt}
                fill
                priority
                sizes="(min-width: 1128px) 560px, 100vw"
                className="object-cover"
              />
            )}
          </div>
        </div>
      </header>

      <section aria-labelledby="confianza-heading" className="py-16 md:py-24">
        <div className="container-site">
          <SectionHeader
            id="confianza-heading"
            eyebrow={t("02/ Lo que puedes esperar")}
            title={t("Confía en nosotros: tu viaje está cubierto")}
          />
          <Reveal>
            <ul className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
              {trust.map(({ icon: Icon, title, body }) => (
                <li key={title} data-reveal className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-fg-brand-primary ring-1 ring-brand-200/60 ring-inset">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-md font-semibold tracking-tight text-primary">
                      {t(title)}
                    </h3>
                    <p className="mt-1.5 text-sm text-tertiary">{t(body)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="vision-heading" className="bg-secondary py-16 md:py-24">
        <div className="container-site grid gap-6 md:grid-cols-2">
          <Reveal className="contents">
            <article
              data-reveal
              className="rounded-2xl bg-primary p-7 ring-1 ring-secondary ring-inset md:p-9"
            >
              <p className="text-[13px] font-medium tracking-[0.03em] text-brand-secondary">
                {t("Nuestra visión")}
              </p>
              <h2
                id="vision-heading"
                className="mt-3 text-2xl leading-[1.2] font-semibold tracking-[-0.03em] text-primary md:text-3xl"
              >
                {t("Inspirar aventuras colectivas con logística de élite en Barcelona")}
              </h2>
              <p className="mt-4 text-tertiary">
                {t(
                  "Nuestra visión como empresa de excursiones es transformar la manera en que los grandes grupos descubren Barcelona. Queremos que cada aventura sea una experiencia de exploración cohesionada.",
                )}
              </p>
            </article>
            <article
              data-reveal
              className="rounded-2xl bg-primary p-7 ring-1 ring-secondary ring-inset md:p-9"
            >
              <p className="text-[13px] font-medium tracking-[0.03em] text-brand-secondary">
                {t("Nuestra misión")}
              </p>
              <h2 className="mt-3 text-2xl leading-[1.2] font-semibold tracking-[-0.03em] text-primary md:text-3xl">
                {t("Soluciones de viaje a medida y rutas de exploración impecables")}
              </h2>
              <p className="mt-4 text-tertiary">
                {t(
                  "Nuestra misión es doble: primero, asegurar que cada ruta de exploración esté diseñada a medida, priorizando el team building. Segundo, garantizar una logística impecable para grupos grandes, cubriendo transporte y seguridad con los más altos estándares.",
                )}
              </p>
            </article>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="ruta-heading" className="py-16 md:py-24">
        <div className="container-site grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-brand-primary ring-1 ring-secondary ring-inset">
            {photo(1) && (
              <Image
                src={photo(1)!.url}
                alt={photo(1)!.alt}
                fill
                sizes="(min-width: 1128px) 520px, 100vw"
                className="object-cover"
              />
            )}
          </div>
          <div>
            <p className="text-[13px] font-medium tracking-[0.03em] text-brand-secondary">
              {t("03/ Para tu grupo")}
            </p>
            <h2
              id="ruta-heading"
              className="mt-3 text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]"
            >
              {t("La ruta de exploración definitiva")}
            </h2>
            <p className="mt-5 text-lg text-tertiary">
              {t(
                "Tripcelona conecta a tu gran grupo con la esencia oculta de Barcelona. Confía en nuestros expertos locales para diseñar una experiencia de exploración personalizada, inolvidable y con logística garantizada para todos.",
              )}
            </p>
            <Reveal>
              <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {included.map((item) => (
                  <li key={item} data-reveal className="flex items-start gap-3 text-primary">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-primary text-fg-brand-primary">
                      <Check aria-hidden className="size-3.5" />
                    </span>
                    {t(item)}
                  </li>
                ))}
              </ul>
            </Reveal>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/crea-tu-tour" size="lg">
                {t("Pedir presupuesto")}
              </ButtonLink>
              <ButtonLink href={site.phoneHref} size="lg" variant="outline">
                {site.phoneDisplay}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {gallery.length > 0 && (
        <section
          aria-labelledby="galeria-heading"
          className="border-t border-secondary py-16 md:py-24"
        >
          <div className="container-site">
            <SectionHeader
              id="galeria-heading"
              eyebrow={t("Galería de aventuras")}
              title={t("Nuestra galería")}
            />
          </div>
          <PhotoGallery photos={gallery} />
        </section>
      )}
    </>
  );
}
