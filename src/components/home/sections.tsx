/*
 * Home page sections in Untitled UI marketing layouts (MIT, © 2025 Untitled
 * UI, https://github.com/untitleduico/react; see THIRD_PARTY_NOTICES.md):
 * section header, feature grid with featured icons, destination tiles and a
 * CTA band. Built from scratch where the original block is PRO-only. Copy
 * only states facts already published on the site.
 */
import {
  ArrowRight,
  Bus,
  CalendarDays,
  CreditCard,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Mountain,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { FeaturedIcon } from "@/components/uui/foundations/featured-icon/featured-icon";
import { buttonClasses } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { buildCatalogUrl } from "@/lib/search";
import { destinations, site } from "@/lib/site";

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
        <ul className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="flex flex-col gap-4">
              <FeaturedIcon icon={f.icon} color="brand" theme="light" size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-primary">{f.title}</h3>
                <p className="mt-1 text-md text-tertiary">{f.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Destinations() {
  return (
    <section aria-labelledby="destinos-heading" className="container-site py-16 md:py-24">
      <SectionHeader
        id="destinos-heading"
        eyebrow="Destinos"
        title="Elige tu próxima escapada"
        lead="Pirineo, volcanes de la Garrotxa y pueblos medievales a pocas horas de Barcelona."
      />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((d) => (
          <li key={d.area}>
            <Link
              href={buildCatalogUrl({ area: d.area, month: "", travellers: "" })}
              className="group flex h-full items-center gap-4 rounded-xl bg-primary p-5 shadow-xs ring-1 ring-secondary transition-shadow ring-inset hover:shadow-md"
            >
              <FeaturedIcon icon={Mountain} color="gray" theme="modern" size="lg" />
              <span className="flex-1 font-semibold text-primary group-hover:underline">
                {d.label}
              </span>
              <ArrowRight
                aria-hidden
                className="size-5 text-fg-quaternary transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GroupsCta({ whatsappHref }: { whatsappHref: string }) {
  return (
    <section aria-labelledby="grupos-heading" className="container-site pb-16 md:pb-24">
      <div className="relative overflow-hidden rounded-2xl bg-brand-section px-6 py-12 text-white md:px-16 md:py-16">
        <div
          aria-hidden
          className="absolute -top-24 -right-24 size-80 rounded-full bg-white/5 ring-[48px] ring-white/5"
        />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2
              id="grupos-heading"
              className="text-3xl leading-[1.2] font-semibold tracking-tight md:text-4xl"
            >
              ¿Organizas una salida en grupo?
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Empresas, asociaciones, colegios o amigos: diseñamos el tour a vuestra medida.
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

export function ContactStrip({
  phoneHref,
  phoneDisplay,
}: {
  phoneHref: string;
  phoneDisplay: string;
}) {
  const items = [
    {
      icon: MessageCircle,
      title: "Preguntas frecuentes",
      body: "Resolvemos las dudas más habituales.",
      href: "/preguntas-frecuentes",
      cta: "Ver FAQ",
    },
    {
      icon: Mail,
      title: "Escríbenos",
      body: "Te respondemos lo antes posible.",
      href: "/contactanos",
      cta: "Contactar",
    },
    { icon: Phone, title: "Llámanos", body: phoneDisplay, href: phoneHref, cta: "Llamar" },
  ];
  return (
    <section aria-label="Contacto" className="border-t border-secondary py-16">
      <ul className="container-site grid gap-8 md:grid-cols-3">
        {items.map((it) => (
          <li key={it.title} className="flex flex-col items-start gap-4">
            <FeaturedIcon icon={it.icon} color="gray" theme="modern" size="lg" />
            <div>
              <h3 className="text-lg font-semibold text-primary">{it.title}</h3>
              <p className="mt-1 text-md text-tertiary">{it.body}</p>
            </div>
            <a
              href={it.href}
              className="text-md font-semibold text-brand-secondary hover:underline"
            >
              {it.cta}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
