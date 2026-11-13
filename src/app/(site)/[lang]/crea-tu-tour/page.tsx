import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/layout/page-hero";
import { QuoteWizard } from "@/components/forms/quote-wizard";
import { WhatsAppCta } from "@/components/tours/empty-state";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getSiteSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/tours/format";
import { getPublishedTours } from "@/lib/tours/queries";
import { createT } from "@/lib/i18n/translate";
import { alternatesFor } from "@/lib/i18n/seo";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/crea-tu-tour">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(lang);
  return {
    title: t("Crea tu tour a medida para grupos"),
    description: t(
      "Empresas, asociaciones y grupos de amigos: elige un plan, la fecha y los extras y te enviamos una propuesta personalizada.",
    ),
    alternates: alternatesFor("/crea-tu-tour", lang),
  };
}

// Heading and intro from the live page (WordPress export, 2026-11-10).
export default async function QuotePage({
  params,
  searchParams,
}: PageProps<"/[lang]/crea-tu-tour">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = createT(lang);
  return (
    <>
      <PageHero
        eyebrow={t("Grupos y empresas")}
        title={t("Crea tu tour a medida")}
        intro={t(
          "¿Vienes con tu empresa, tu asociación o un grupo de amigos? Elige un plan, la fecha y los extras, y te enviamos una propuesta personalizada en 24–48 horas.",
        )}
      />
      <div className="container-site grid gap-8 py-10 md:py-14 lg:grid-cols-[1fr_300px]">
        <section className="rounded-2xl border border-secondary bg-white p-5 md:p-6">
          <Suspense fallback={<PageSkeleton />}>
            <Wizard searchParams={searchParams} locale={lang} />
          </Suspense>
        </section>
        <aside className="space-y-3">
          <h2 className="text-display-sm">{t("¿Prefieres hablarlo?")}</h2>
          <WhatsAppCta
            message="Hola Tripcelona, quiero organizar una excursión para mi grupo."
            label="Hablar por WhatsApp"
            locale={lang}
          />
        </aside>
      </div>
    </>
  );
}

async function Wizard({
  searchParams,
  locale,
}: {
  searchParams: PageProps<"/[lang]/crea-tu-tour">["searchParams"];
  locale: Locale;
}) {
  const [{ excursion }, tours, settings] = await Promise.all([
    searchParams,
    getPublishedTours(locale),
    getSiteSettings(),
  ]);
  const options = tours.map((tour) => ({
    slug: tour.slug,
    title: tour.title,
    priceFrom: tour.priceFromCents ? formatPrice(tour.priceFromCents, locale) : null,
  }));
  const initial =
    typeof excursion === "string" && options.some((o) => o.slug === excursion)
      ? excursion
      : undefined;
  return (
    <QuoteWizard
      tours={options}
      extras={settings.quoteExtras}
      groupNote={settings.quoteNote}
      initialTour={initial}
    />
  );
}
