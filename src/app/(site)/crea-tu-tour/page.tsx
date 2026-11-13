import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/layout/page-hero";
import { QuoteWizard } from "@/components/forms/quote-wizard";
import { WhatsAppCta } from "@/components/tours/empty-state";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getSiteSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/tours/format";
import { getPublishedTours } from "@/lib/tours/queries";

export const metadata: Metadata = {
  title: "Crea tu tour a medida para grupos",
  description:
    "Empresas, asociaciones y grupos de amigos: elige un plan, la fecha y los extras y te enviamos una propuesta personalizada.",
  alternates: { canonical: "/crea-tu-tour" },
};

// Heading and intro from the live page (WordPress export, 2026-11-10).
export default function QuotePage({ searchParams }: PageProps<"/crea-tu-tour">) {
  return (
    <>
      <PageHero
        eyebrow="Grupos y empresas"
        title="Crea tu tour a medida"
        intro="¿Vienes con tu empresa, tu asociación o un grupo de amigos? Elige un plan, la fecha y los extras, y te enviamos una propuesta personalizada en 24–48 horas."
      />
      <div className="container-site grid gap-8 py-10 md:py-14 lg:grid-cols-[1fr_300px]">
        <section className="rounded-2xl border border-secondary bg-white p-5 md:p-6">
          <Suspense fallback={<PageSkeleton />}>
            <Wizard searchParams={searchParams} />
          </Suspense>
        </section>
        <aside className="space-y-3">
          <h2 className="text-display-sm">¿Prefieres hablarlo?</h2>
          <WhatsAppCta
            message="Hola Tripcelona, quiero organizar una excursión para mi grupo."
            label="Hablar por WhatsApp"
          />
        </aside>
      </div>
    </>
  );
}

async function Wizard({
  searchParams,
}: {
  searchParams: PageProps<"/crea-tu-tour">["searchParams"];
}) {
  const [{ excursion }, tours, settings] = await Promise.all([
    searchParams,
    getPublishedTours(),
    getSiteSettings(),
  ]);
  const options = tours.map((t) => ({
    slug: t.slug,
    title: t.title,
    priceFrom: t.priceFromCents ? formatPrice(t.priceFromCents) : null,
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
