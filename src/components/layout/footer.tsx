import { ArrowUpRight, Phone } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { SOCIAL_LABELS, SOCIAL_NETWORKS, getSiteSettings } from "@/lib/settings";
import { footerColumns, site as siteDefaults } from "@/lib/site";
import { getPublishedTours } from "@/lib/tours/queries";

/**
 * Light footer: brand block and a contact card on top, five link columns,
 * then a one-line legal band. Hairlines separate the three rows.
 */
export async function Footer() {
  const [site, tours] = await Promise.all([getSiteSettings(), getPublishedTours().catch(() => [])]);
  const socials = SOCIAL_NETWORKS.filter((n) => site.socials[n]);
  const openDepartures = tours.reduce(
    (sum, t) => sum + t.departures.filter((d) => d.status === "open").length,
    0,
  );

  return (
    <footer className="mt-auto border-t border-secondary bg-primary text-primary">
      <div className="container-site">
        <div className="grid gap-10 py-14 md:py-16 lg:grid-cols-[1fr_400px] lg:gap-16">
          <div>
            <Link href="/" className="inline-flex rounded-md">
              <Logo className="text-xl" markClassName="size-9" />
              <span className="sr-only"> - inicio</span>
            </Link>
            <p className="mt-6 text-md font-semibold text-primary">
              Excursiones de un día desde Barcelona, cada domingo.
            </p>
            <p className="mt-2 max-w-md text-md text-tertiary">
              Autocar, guía local y logística incluidos. Salimos desde {siteDefaults.meetingPoint}.
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
                  ? "1 salida abierta para reservar"
                  : `${openDepartures} salidas abiertas para reservar`}
              </Link>
            )}
          </div>

          <div className="rounded-xl bg-secondary p-6 ring-1 ring-secondary ring-inset md:p-7">
            <h2 className="text-lg font-semibold tracking-tight">¿Tienes alguna duda?</h2>
            <p className="mt-2 text-sm text-tertiary">
              Escríbenos por WhatsApp y te ayudamos a elegir excursión, fecha y punto de salida.
            </p>
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "secondary", size: "lg" }, "mt-5 w-full")}
            >
              <WhatsAppIcon />
              Escríbenos por WhatsApp
            </a>
            <a
              href={site.phoneHref}
              className="mt-3 flex items-center justify-center gap-2 text-sm text-tertiary hover:text-primary"
            >
              <Phone aria-hidden className="size-4" />o llámanos al {site.phoneDisplay}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-secondary py-12 md:grid-cols-3 lg:grid-cols-5">
          {footerColumns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-sm font-semibold text-primary">{col.title}</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-tertiary hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-secondary py-8 text-sm text-tertiary md:flex-row md:items-center md:justify-between">
          <p>
            © 2026 Tripcelona · Barcelona, España
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
            <ul className="flex flex-wrap gap-4" aria-label="Redes sociales">
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
