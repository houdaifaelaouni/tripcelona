import type { Metadata } from "next";
import { FaqList } from "@/components/content/faq-list";
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
    <div className="container-site py-8 md:py-12">
      {schema && <JsonLd data={schema} />}
      <h1 className="text-3xl">Preguntas frecuentes</h1>
      <div className="mt-6 max-w-3xl">
        <FaqList faqs={faqs} />
      </div>
      <div className="mt-10 rounded-panel bg-surface-alt p-6">
        <h2 className="text-xl">¿No encuentras tu respuesta?</h2>
        <div className="mt-4">
          <WhatsAppCta message="Hola, tengo una pregunta sobre vuestras excursiones." />
        </div>
      </div>
    </div>
  );
}
