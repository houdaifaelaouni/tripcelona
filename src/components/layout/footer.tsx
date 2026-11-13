import { BADGES, PAYMENT_METHODS } from "@/lib/brand-assets";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import Image from "next/image";
import Link from "@/components/i18n/link";
import { Logo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button";
import { SOCIAL_LABELS, SOCIAL_NETWORKS, getSiteSettings } from "@/lib/settings";
import { getSiteContent } from "@/lib/site-content";
import { site as siteDefaults } from "@/lib/site";
import { getPublishedTours } from "@/lib/tours/queries";
import { createT } from "@/lib/i18n/translate";
import type { Locale } from "@/lib/i18n/config";

/** Card brands the bank terminal accepts, shown as supplied by the owner. */
/**
 * Light footer: brand block and a contact card on top, five link columns,
 * then a one-line legal band. Hairlines separate the three rows.
 */
export async function Footer({ locale }: { locale: Locale }) {
  const t = createT(locale);
  const [site, tours, content] = await Promise.all([
    getSiteSettings(),
    getPublishedTours(locale).catch(() => []),
    getSiteContent(),
  ]);
  const footerColumns = content.footer;
  const socials = SOCIAL_NETWORKS.filter((n) => site.socials[n]);
  const openDepartures = tours.reduce(
    (sum, tour) => sum + tour.departures.filter((d) => d.status === "open").length,
    0,
  );

  return (
    <footer className="mt-auto border-t border-secondary bg-primary text-primary">
      <div className="container-site">
        <div className="grid gap-10 py-14 md:py-16 lg:grid-cols-[1fr_400px] lg:gap-16">
          <div>
            <Link href="/" className="inline-flex rounded-md">
              <Logo className="h-20" />
              <span className="sr-only"> - {t("inicio")}</span>
            </Link>
            <p className="mt-6 text-md font-semibold text-primary">
              {t("Excursiones de un día desde Barcelona, cada domingo.")}
            </p>
            <p className="mt-2 max-w-md text-md text-tertiary">
              {t("Autocar, guía local y logística incluidos. Salimos desde {place}.", {
                place: siteDefaults.meetingPoint,
              })}
            </p>
            {openDepartures > 0 && (
              <Link
                href="/ofertas-de-viajes"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary ring-1 ring-secondary ring-inset hover:text-primary"
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success-solid opacity-60 motion-reduce:hidden" />
                  <span className="relative inline-flex size-2 rounded-full bg-success-solid" />
                </span>
                {openDepartures === 1
                  ? t("1 salida abierta para reservar")
                  : t("{n} salidas abiertas para reservar", { n: openDepartures })}
              </Link>
            )}
          </div>

          <div className="rounded-xl bg-secondary p-6 ring-1 ring-secondary ring-inset md:p-7">
            <h2 className="text-lg font-semibold tracking-tight">{t("¿Tienes alguna duda?")}</h2>
            <p className="mt-2 text-sm text-tertiary">
              {t(
                "Escríbenos por email o llámanos y te ayudamos a elegir excursión, fecha y punto de salida.",
              )}
            </p>
            <a
              href={site.email ? `mailto:${site.email}` : "/contactanos"}
              className={buttonClasses({ variant: "secondary", size: "lg" }, "mt-5 w-full")}
            >
              <Mail aria-hidden className="size-5" />
              {t("Escríbenos por email")}
            </a>
            <a
              href={site.phoneHref}
              className="mt-3 flex items-center justify-center gap-2 text-sm text-tertiary hover:text-primary"
            >
              <Phone aria-hidden className="size-4" />
              {t("o llámanos al {phone}", { phone: site.phoneDisplay })}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-secondary py-12 md:grid-cols-3 lg:grid-cols-5">
          {footerColumns.map((col) => (
            <nav key={col.title} aria-label={t(col.title)}>
              <h2 className="text-sm font-semibold text-primary">{t(col.title)}</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-tertiary hover:text-primary">
                      {t(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-secondary py-6 sm:flex-row sm:items-center sm:gap-5">
          <p className="text-sm font-medium text-secondary">{t("Aceptamos")}</p>
          <ul className="flex flex-wrap gap-2" aria-label={t("Tarjetas aceptadas")}>
            {PAYMENT_METHODS.map((m) => (
              <li key={m.name}>
                <Image
                  src={m.src}
                  alt={m.name}
                  width={72}
                  height={45}
                  className="h-8 w-auto rounded-md ring-1 ring-secondary ring-inset"
                />
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row sm:items-center sm:gap-5">
            <p className="text-sm font-medium text-secondary">{t("Reconocimientos")}</p>
            <ul
              className="flex flex-wrap items-center gap-4 "
              aria-label={t("Premios y reconocimientos")}
            >
              {BADGES.map((b) => (
                <li key={b.name}>
                  <Image
                    src={b.src}
                    alt={b.name}
                    width={b.width}
                    height={b.height}
                    className="h-10 w-auto"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-secondary py-8 text-sm text-tertiary md:flex-row md:items-center md:justify-between">
          <p>
            © 2026 Tripcelona · Barcelona, {t("España")}
            {site.email && (
              <>
                {" · "}
                <a href={`mailto:${site.email}`} className="hover:text-primary">
                  {site.email}
                </a>
              </>
            )}
          </p>
          {socials.length > 0 && (
            <ul className="flex flex-wrap gap-4" aria-label={t("Redes sociales")}>
              {socials.map((n) => (
                <li key={n}>
                  <a
                    href={site.socials[n]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-primary"
                  >
                    {SOCIAL_LABELS[n]}
                    <ArrowUpRight aria-hidden className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
