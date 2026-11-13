import type { Metadata } from "next";
import { FaqList } from "@/components/content/faq-list";
import { CtaBand } from "@/components/layout/cta-band";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { WhatsAppCta } from "@/components/tours/empty-state";
import { getPublishedFaqs } from "@/lib/content/queries";
import { faqJsonLd } from "@/lib/seo/json-ld";
import { createT } from "@/lib/i18n/translate";
import { alternatesFor } from "@/lib/i18n/seo";
import { isLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/preguntas-frecuentes">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(lang);
  return {
    title: t("Preguntas frecuentes"),
    description: t(
      "Reservas, pagos, punto de encuentro, cancelaciones y qué pasa si llueve: respuestas sobre nuestras excursiones en grupo.",
    ),
    alternates: alternatesFor("/preguntas-frecuentes", lang),
  };
}

export default async function FaqPage({ params }: PageProps<"/[lang]/preguntas-frecuentes">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = createT(lang);
  const faqs = await getPublishedFaqs(lang);
  const schema = faqJsonLd(faqs);
  return (
    <>
      {schema && <JsonLd data={schema} />}
      <PageHero
        eyebrow={t("Ayuda")}
        title={t("Preguntas frecuentes")}
        intro={t("Reservas, pagos, punto de encuentro y qué pasa si llueve.")}
      />
      <div className="container-site py-10 md:py-14">
        <div className="max-w-3xl">
          <FaqList faqs={faqs} />
        </div>
      </div>
      <CtaBand
        title={t("¿No encuentras tu respuesta?")}
        text={t("Escríbenos y te respondemos lo antes posible.")}
      >
        <WhatsAppCta message="Hola, tengo una pregunta sobre vuestras excursiones." locale={lang} />
      </CtaBand>
    </>
  );
}
