import type { Metadata } from "next";
import { ChatArt, FaqArt } from "@/components/art/art";
import { FaqList } from "@/components/content/faq-list";
import { CtaBand } from "@/components/layout/cta-band";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { WhatsAppCta } from "@/components/tours/empty-state";
import { getPublishedFaqs } from "@/lib/content/queries";
import { faqJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Reservas, pagos, punto de encuentro, cancelaciones y qué pasa si llueve: respuestas sobre nuestras excursiones en grupo.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

export default async function FaqPage() {
  const faqs = await getPublishedFaqs();
  const schema = faqJsonLd(faqs);
  return (
    <>
      {schema && <JsonLd data={schema} />}
      <PageHero
        eyebrow="Ayuda"
        title="Preguntas frecuentes"
        intro="Reservas, pagos, punto de encuentro y qué pasa si llueve."
        art={<FaqArt />}
      />
      <div className="container-site py-10 md:py-14">
        <div className="max-w-3xl">
          <FaqList faqs={faqs} />
        </div>
      </div>
      <CtaBand
        title="¿No encuentras tu respuesta?"
        text="Escríbenos y te respondemos lo antes posible."
        art={<ChatArt />}
      >
        <WhatsAppCta message="Hola, tengo una pregunta sobre vuestras excursiones." />
      </CtaBand>
    </>
  );
}
