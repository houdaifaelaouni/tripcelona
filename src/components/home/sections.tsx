/*
 * Home page sections in Untitled UI marketing layouts (MIT, © 2025 Untitled
 * UI, https://github.com/untitleduico/react; see THIRD_PARTY_NOTICES.md):
 * section header, feature grid with featured icons, destination tiles and a
 * CTA band. Built from scratch where the original block is PRO-only. Copy
 * only states facts already published on the site.
 */
import { MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "@/components/i18n/link";
import type { ReactNode } from "react";
import { FeaturedIcon } from "@/components/uui/foundations/featured-icon/featured-icon";
import { createT } from "@/lib/i18n/translate";
import type { Locale } from "@/lib/i18n/config";
import { site } from "@/lib/site";
import { Reveal } from "@/components/motion/reveal";
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

export function ContactSection({
  phoneHref,
  phoneDisplay,
  whatsappHref,
  locale,
}: {
  phoneHref: string;
  phoneDisplay: string;
  whatsappHref: string;
  locale: Locale;
}) {
  const t = createT(locale);
  const items = [
    { icon: Phone, title: t("Teléfono"), body: phoneDisplay, href: phoneHref },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      body: t("Escríbenos por WhatsApp"),
      href: whatsappHref,
    },
    {
      icon: MapPin,
      title: t("Punto de salida"),
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
            eyebrow={t("Contacto")}
            title={t("Hablemos")}
            lead={t(
              "¿Tienes dudas sobre una excursión? Escríbenos y te respondemos lo antes posible.",
            )}
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
        <div className="rounded-xl bg-primary p-6 ring-1 ring-secondary ring-inset md:p-8">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
