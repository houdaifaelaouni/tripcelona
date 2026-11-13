import { Mountain } from "lucide-react";
import Link from "next/link";
import { SOCIAL_LABELS, SOCIAL_NETWORKS, getSiteSettings } from "@/lib/settings";
import { buttonClasses } from "@/components/ui/button";
import { footerColumns, site as siteDefaults } from "@/lib/site";

export async function Footer() {
  const site = await getSiteSettings();
  const socials = SOCIAL_NETWORKS.filter((n) => site.socials[n]);
  return (
    <footer className="mt-auto border-t border-secondary bg-secondary text-primary">
      {/* Light footer: CTA row, link columns, legal band, hairline dividers. */}
      <div className="container-site flex flex-col gap-6 border-b border-secondary py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-2xl font-semibold tracking-tight">¿Listo para tu próxima excursión?</p>
          <p className="mt-2 text-md text-tertiary">
            Consulta las próximas salidas y reserva tu plaza.
          </p>
        </div>
        <Link href="/ofertas-de-viajes" className={buttonClasses({ size: "lg" })}>
          Ver excursiones
        </Link>
      </div>
      <div className="container-site grid gap-x-8 gap-y-10 py-12 md:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-md bg-brand-solid text-white [&>svg]:size-4"
            >
              <Mountain />
            </span>
            {siteDefaults.name}
          </p>
          <p className="mt-4 text-sm text-tertiary">
            Rutas guiadas, escapadas y ofertas de viaje para grupos.
          </p>
        </div>

        {footerColumns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-[13px] font-medium tracking-[0.03em] text-quaternary uppercase">
              {col.title}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-block py-0.5 text-tertiary underline-offset-2 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="text-[13px] font-medium tracking-[0.03em] text-quaternary uppercase">
            Contáctanos
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-tertiary">
            <li>
              <a href={site.phoneHref} className="hover:text-primary">
                Teléfono: {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                Reservar por WhatsApp
              </a>
            </li>
            {site.email && (
              <li>
                <a href={`mailto:${site.email}`} className="hover:text-primary">
                  {site.email}
                </a>
              </li>
            )}
            <li>
              <span className="font-medium text-primary">Salidas:</span>{" "}
              <a
                href={siteDefaults.meetingPointMapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                {siteDefaults.meetingPoint}
              </a>
            </li>
            {socials.length > 0 && (
              <li>
                <ul className="flex flex-wrap gap-3" aria-label="Redes sociales">
                  {socials.map((n) => (
                    <li key={n}>
                      <a
                        href={site.socials[n]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                      >
                        {SOCIAL_LABELS[n]}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            )}
            {/* TODO(PO): office/phone schedule text for FR-04 — not on the live site. */}
          </ul>
        </div>
      </div>
      <div className="border-t border-secondary">
        <p className="container-site py-8 text-xs text-quaternary">
          Copyright © 2026 Tripcelona | Todos los derechos reservados
        </p>
      </div>
    </footer>
  );
}
