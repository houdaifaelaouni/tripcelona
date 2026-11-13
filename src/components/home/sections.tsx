/*
 * Home page sections in Untitled UI marketing layouts (MIT, © 2025 Untitled
 * UI, https://github.com/untitleduico/react; see THIRD_PARTY_NOTICES.md):
 * section header, feature grid with featured icons, destination tiles and a
 * CTA band. Built from scratch where the original block is PRO-only. Copy
 * only states facts already published on the site.
 */
import { ChatArt } from "@/components/art/art";
import {
  Bus,
  CalendarDays,
  CreditCard,
  MapPin,
  MessageCircle,
  Phone,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { FeaturedIcon } from "@/components/uui/foundations/featured-icon/featured-icon";
import { buttonClasses } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { site } from "@/lib/site";
import { Reveal } from "@/components/motion/reveal";
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
        <p className="text-[13px] font-medium tracking-[0.03em] text-brand-secondary">{eyebrow}</p>
        <h2
          id={id}
          className="mt-3 text-3xl leading-[1.15] font-semibold text-primary md:text-4xl md:leading-[1.15]"
        >
          {title}
        </h2>
        {lead && <p className="mt-4 text-lg text-tertiary">{lead}</p>}
      </div>
      {action}
    </div>
  );
}

const features = [
  {
    icon: Bus,
    title: "Transporte incluido",
    body: "Ida y vuelta en autocar desde Barcelona. Solo tienes que llegar a la hora de salida.",
  },
  {
    icon: UserCheck,
    title: "Guía local",
    body: "Un guía que conoce la zona acompaña al grupo durante toda la excursión.",
  },
  {
    icon: MapPin,
    title: "Punto de salida céntrico",
    body: `Salimos desde ${site.meetingPoint}.`,
  },
  {
    icon: CalendarDays,
    title: "Excursiones de un día",
    body: "Salidas los domingos: vuelves a Barcelona el mismo día.",
  },
  {
    icon: CreditCard,
    title: "Pago seguro con tarjeta",
    body: "Reserva tu plaza online con pago seguro y recibe la confirmación por email.",
  },
  {
    icon: Users,
    title: "Tours para grupos",
    body: "¿Vais en grupo? Cuéntanos qué buscáis y preparamos una propuesta a medida.",
  },
];

export function WhyUs() {
  return (
    <section aria-labelledby="por-que-heading" className="bg-secondary py-16 md:py-24">
      <div className="container-site">
        <SectionHeader
          id="por-que-heading"
          eyebrow="Por qué Tripcelona"
          title="Tú disfrutas del día, nosotros nos ocupamos del resto"
          lead="Transporte, guía local y logística incluidos en cada excursión."
        />
        <Reveal>
          <ul className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li key={f.title} data-reveal className="flex flex-col gap-4">
                <FeaturedIcon icon={f.icon} color="brand" theme="light" size="lg" />
                <div>
                  <h3 className="text-lg font-semibold text-primary">{f.title}</h3>
                  <p className="mt-1 text-md text-tertiary">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

export function GroupsCta({ whatsappHref }: { whatsappHref: string }) {
  return (
    <section aria-labelledby="grupos-heading" className="container-site pb-16 md:pb-24">
      <div className="relative overflow-hidden rounded-2xl bg-brand-section px-6 py-12 text-white md:px-16 md:py-16">
        <CoachIllustration className="pointer-events-none absolute -right-6 -bottom-6 hidden w-64 opacity-90 xl:block" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between xl:pr-56">
          <div className="max-w-2xl">
            <h2 id="grupos-heading" className="text-3xl leading-[1.15] font-semibold md:text-4xl">
              ¿Organizas una salida en grupo?
            </h2>
            <p className="mt-4 text-lg text-white/70">
              Empresas, asociaciones, colegios o amigos: diseñamos el tour a vuestra medida.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/crea-tu-tour" className={buttonClasses({ size: "lg" })}>
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
    <section aria-labelledby="hablemos-heading" className="bg-secondary py-16 md:py-24">
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
          <div
            data-art-host
            className="mt-8 hidden w-56 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-secondary lg:block"
          >
            <ChatArt />
          </div>
        </div>
        <div className="rounded-xl bg-primary p-6 ring-1 ring-secondary ring-inset md:p-8">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
