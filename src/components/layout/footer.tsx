import Link from "next/link";
import { SOCIAL_LABELS, SOCIAL_NETWORKS, getSiteSettings } from "@/lib/settings";
import { footerColumns, site as siteDefaults } from "@/lib/site";

export async function Footer() {
  const site = await getSiteSettings();
  const socials = SOCIAL_NETWORKS.filter((n) => site.socials[n]);
  return (
    <footer className="mt-auto bg-navy text-white">
      {/* Light-weight footer (design rule): link columns, then a legal band. */}
      <div className="container-site grid gap-x-6 gap-y-10 py-12 md:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="text-display-sm font-bold">{siteDefaults.name}</p>
          <p className="mt-2 text-meta text-white/80">
            Rutas guiadas, escapadas y ofertas de viaje para grupos.
          </p>
        </div>

        {footerColumns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-base font-medium">{col.title}</h2>
            <ul className="mt-4 space-y-3 text-meta">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/80 underline-offset-2 hover:text-white hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="text-base font-medium">Contáctanos</h2>
          <ul className="mt-4 space-y-3 text-meta text-white/80">
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
        <p className="container-site py-6 text-caption text-white/70">
          Copyright © 2026 Tripcelona | Todos los derechos reservados
        </p>
      </div>
    </footer>
  );
}
