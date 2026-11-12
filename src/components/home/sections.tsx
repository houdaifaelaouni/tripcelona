/*
 * Home page sections in Untitled UI marketing layouts (MIT, © 2025 Untitled
 * UI, https://github.com/untitleduico/react; see THIRD_PARTY_NOTICES.md):
 * section header, the "why us" split with a photo collage, the groups band
 * and the contact block. Copy only states facts already published on the
 * site.
 */
import { Check, MapPin, MessageCircle, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { FeaturedIcon } from "@/components/uui/foundations/featured-icon/featured-icon";
import { buttonClasses } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { site } from "@/lib/site";
import { cn } from "@/lib/cn";
import type { TourImage } from "@/lib/tours/types";
import { CoachIllustration } from "./illustrations";
import { ContactForm } from "@/components/forms/contact-form";

export function SectionHeader({
  id,
  eyebrow,
  title,
  lead,
  action,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-brand-secondary md:text-md">{eyebrow}</p>
        <h2
          id={id}
          className="mt-3 text-3xl leading-[1.2] font-semibold tracking-tight text-primary md:text-4xl"
        >
          {title}
        </h2>
        {lead && <p className="mt-4 text-lg text-tertiary md:text-xl">{lead}</p>}
      </div>
      {action}
    </div>
  );
}

/** Reasons already implied by the hero, the strip and the catalogue. */
const reasons = [
  "Excursiones de un día con transporte ida y vuelta y guía local incluidos.",
  "Salidas desde un punto céntrico de Barcelona: sin coche, sin atascos y sin buscar aparcamiento.",
  "Organización cuidada para que aprovechéis cada momento del viaje.",
  "Reserva online con pago seguro y confirmación por email.",
  "Trato directo con el equipo que organiza el viaje, sin intermediarios.",
];

export function WhyUs({ photos }: { photos: TourImage[] }) {
  const collage = photos.slice(0, 3);
  return (
    <section aria-labelledby="por-que-heading" className="container-site py-16 md:py-24">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <p className="text-sm font-semibold text-brand-secondary md:text-md">
            Nuestra forma de viajar
          </p>
          <h2
            id="por-que-heading"
            className="mt-3 text-3xl leading-[1.2] font-semibold tracking-tight text-primary md:text-4xl"
          >
            ¿Por qué Tripcelona?
          </h2>
          <ul className="mt-8 space-y-4">
            {reasons.map((reason) => (
              <li key={reason} className="flex gap-3 text-md text-secondary">
                <Check
                  aria-hidden
                  strokeWidth={2}
                  className="mt-0.5 size-5 shrink-0 text-brand-secondary"
                />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
          <Link href="/sobre-nosotros" className={buttonClasses({ size: "lg" }, "mt-9")}>
            Conoce al equipo
          </Link>
        </div>

        {collage.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            {collage.map((photo, i) => (
              <figure
                key={`${photo.url}-${i}`}
                className={cn(
                  "relative overflow-hidden rounded-card bg-secondary",
                  i === 0 ? "col-span-2 aspect-[16/10]" : "aspect-[4/5]",
                )}
              >
                <Image
                  src={photo.url}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1128px) 30vw, (min-width: 744px) 45vw, 92vw"
                  className="object-cover"
                />
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function GroupsCta({ whatsappHref }: { whatsappHref: string }) {
  return (
    <section aria-labelledby="grupos-heading" className="container-site pb-16 md:pb-24">
      <div className="relative overflow-hidden rounded-panel bg-brand-section px-6 py-12 text-white md:px-16 md:py-16">
        <CoachIllustration className="pointer-events-none absolute -right-6 -bottom-6 hidden w-64 opacity-90 xl:block" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between xl:pr-56">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-white/75">Colegios, institutos y grupos</p>
            <h2
              id="grupos-heading"
              className="mt-3 text-3xl leading-[1.2] font-semibold tracking-tight md:text-4xl"
            >
              ¿Vienes con tu grupo?
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Diseñamos el itinerario, el transporte y las visitas a la medida de tu grupo.
              Cuéntanos qué necesitáis y te preparamos una propuesta.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/crea-tu-tour"
              className={buttonClasses({ size: "lg" }, "bg-white text-navy hover:bg-brand-50")}
            >
              Crea tu tour
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "whatsapp", size: "lg" })}
            >
              <WhatsAppIcon />
              Escríbenos por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContactSection({
  phoneHref,
  phoneDisplay,
  whatsappHref,
}: {
  phoneHref: string;
  phoneDisplay: string;
  whatsappHref: string;
}) {
  const items = [
    { icon: Phone, title: "Teléfono", body: phoneDisplay, href: phoneHref },
    { icon: MessageCircle, title: "WhatsApp", body: "Escríbenos por WhatsApp", href: whatsappHref },
    {
      icon: MapPin,
      title: "Punto de salida",
      body: site.meetingPoint,
      href: site.meetingPointMapHref,
    },
  ];
  return (
    <section
      aria-labelledby="hablemos-heading"
      className="border-t border-secondary py-16 md:py-24"
    >
      <div className="container-site grid gap-12 lg:grid-cols-2">
        <div>
          <SectionHeader
            id="hablemos-heading"
            eyebrow="Contacto"
            title="Hablemos"
            lead="¿Tienes dudas sobre una excursión? Escríbenos y te respondemos lo antes posible."
          />
          <ul className="mt-10 space-y-6">
            {items.map((it) => (
              <li key={it.title} className="flex gap-4">
                <FeaturedIcon icon={it.icon} color="brand" theme="light" size="lg" />
                <div>
                  <h3 className="text-lg font-semibold text-primary">{it.title}</h3>
                  <a
                    href={it.href}
                    {...(it.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="text-md text-brand-secondary hover:underline"
                  >
                    {it.body}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-panel bg-primary p-6 shadow-lg ring-1 ring-secondary ring-inset md:p-8">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
