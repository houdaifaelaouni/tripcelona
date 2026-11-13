import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import Link from "next/link";
import { ContactForm } from "@/components/forms/contact-form";
import { WhatsAppCta } from "@/components/tours/empty-state";
import { getSiteSettings } from "@/lib/settings";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Escríbenos, llámanos o envíanos un WhatsApp para reservas y excursiones para grupos.",
  alternates: { canonical: "/contactanos" },
};

// Copy from the live page (WordPress export, 2026-11-10).
export default async function ContactPage() {
  const s = await getSiteSettings();
  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="¿En qué podemos ayudarte?"
        intro="Estamos aquí para tu grupo 24 horas, 7 días a la semana, listos para la aventura."
      />
      <div className="container-site grid gap-8 py-10 md:py-14 lg:grid-cols-[1fr_320px]">
        <section
          aria-labelledby="form-title"
          className="rounded-2xl border border-secondary bg-white p-5 md:p-6"
        >
          <h2 id="form-title" className="mb-4 text-display-sm">
            Completa el formulario y uno de nuestros expertos en viajes y logística se pondrá en
            contacto.
          </h2>
          <ContactForm />
        </section>
        <aside className="space-y-6">
          <div>
            <h2 className="text-display-sm">Llámanos</h2>
            <a href={s.phoneHref} className="mt-1 block font-semibold text-blue underline">
              {s.phoneDisplay}
            </a>
          </div>
          <div>
            <h2 className="text-display-sm">WhatsApp</h2>
            <div className="mt-2">
              <WhatsAppCta
                message="Hola Tripcelona, quiero información sobre vuestras excursiones."
                label="Escríbenos por WhatsApp"
              />
            </div>
          </div>
          {s.email && (
            <div>
              <h2 className="text-display-sm">Email</h2>
              <a
                href={`mailto:${s.email}`}
                className="mt-1 block font-semibold text-blue underline"
              >
                {s.email}
              </a>
            </div>
          )}
          <div>
            <h2 className="text-display-sm">Punto de salida</h2>
            <a
              href={site.meetingPointMapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-blue underline"
            >
              {s.meetingPoint}
            </a>
          </div>
          <p>
            <Link href="/preguntas-frecuentes" className="text-blue underline">
              Preguntas frecuentes
            </Link>
          </p>
        </aside>
      </div>
    </>
  );
}
