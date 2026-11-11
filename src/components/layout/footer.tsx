import { Mountain } from "lucide-react";
import Link from "next/link";
import { SOCIAL_LABELS, SOCIAL_NETWORKS, getSiteSettings } from "@/lib/settings";
import { buttonClasses } from "@/components/ui/button";
import { footerColumns, site as siteDefaults } from "@/lib/site";

export async function Footer() {
  const site = await getSiteSettings();
  const socials = SOCIAL_NETWORKS.filter((n) => site.socials[n]);
  return (
    <footer className="mt-auto bg-brand-section text-white">
      {/* Untitled UI footer layout (MIT): CTA row, link columns, legal band. */}
      <div className="container-site flex flex-col gap-6 border-b border-white/15 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xl font-semibold">¿Listo para tu próxima excursión?</p>
          <p className="mt-2 text-md text-white/80">
            Consulta las próximas salidas y reserva tu plaza.
          </p>
        </div>
        <Link
          href="/ofertas-de-viajes"
          className={buttonClasses({ size: "lg" }, "bg-white text-navy hover:bg-brand-50")}
        >
          Ver excursiones
        </Link>
      </div>
      <div className="container-site grid gap-x-8 gap-y-10 py-12 md:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="flex items-center gap-2 text-xl font-bold">
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-lg [&>svg]:size-5 bg-white text-md text-navy"
            >
              <Mountain />
            </span>
            {siteDefaults.name}
          </p>
          <p className="mt-4 text-md text-white/80">
            Rutas guiadas, escapadas y ofertas de viaje para grupos.
          </p>
        </div>

        {footerColumns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-semibold text-white/70">{col.title}</h2>
            <ul className="mt-4 space-y-3 text-md font-semibold">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-block py-0.5 text-white/85 underline-offset-2 hover:text-white hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="text-sm font-semibold text-white/70">Contáctanos</h2>
          <ul className="mt-4 space-y-3 text-md text-white/80">
            <li>
              <a href={site.phoneHref} className="hover:text-white hover:underline">
                Teléfono: {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white hover:underline"
              >
                Reservar por WhatsApp
              </a>
            </li>
            {site.email && (
              <li>
                <a href={`mailto:${site.email}`} className="hover:text-white hover:underline">
                  {site.email}
                </a>
              </li>
            )}
            <li>
              <span className="font-semibold text-white">Salidas:</span>{" "}
              <a
                href={siteDefaults.meetingPointMapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white hover:underline"
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
                        className="underline hover:text-white"
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
      <div className="border-t border-white/15">
        <p className="container-site py-8 text-md text-white/70">
          Copyright © 2026 Tripcelona | Todos los derechos reservados
        </p>
      </div>
    </footer>
  );
}
