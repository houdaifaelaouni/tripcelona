import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";
import { primaryNav } from "@/lib/site";
import { ChevronDownIcon, PhoneIcon, TicketIcon, WhatsAppIcon } from "@/components/ui/icons";
import { MobileNav } from "./mobile-nav";

export async function Header() {
  const site = await getSiteSettings();
  return (
    <header className="sticky top-0 z-40 bg-navy text-white">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        {/* TODO(PO): replace the wordmark with the SVG logo (access checklist). */}
        <Link
          href="/"
          className="shrink-0 text-xl font-bold tracking-tight"
          aria-label="Tripcelona - Excursiones en grupo por Cataluña, inicio"
        >
          Tripcelona
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) =>
              item.children ? (
                <li key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 rounded-control px-3 py-2 font-bold hover:bg-white/10"
                  >
                    {item.label}
                    <ChevronDownIcon />
                  </Link>
                  {/* Opens on hover and on keyboard focus inside the item. */}
                  <ul className="invisible absolute top-full left-0 min-w-52 rounded-card bg-white py-2 text-ink opacity-0 shadow-panel transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link href={child.href} className="block px-4 py-2 hover:bg-surface-alt">
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-control px-3 py-2 font-bold hover:bg-white/10"
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <a
            href={site.phoneHref}
            className="hidden items-center gap-2 rounded-control px-3 py-2 font-bold hover:bg-white/10 md:flex"
          >
            <PhoneIcon />
            <span>{site.phoneDisplay}</span>
          </a>
          <a
            href={site.whatsappHref}
            className="flex items-center gap-2 rounded-control px-3 py-2 font-bold hover:bg-white/10"
            aria-label="Escríbenos por WhatsApp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon />
          </a>
          {/* Booking indicator: the WooCommerce cart becomes a single /reservar
              flow (PRD §6). The count arrives with the checkout in Sprint 5. */}
          <Link
            href="/reservar"
            className="flex items-center gap-2 rounded-control px-3 py-2 hover:bg-white/10"
            aria-label="Mi reserva"
          >
            <TicketIcon />
          </Link>
          <MobileNav
            phoneDisplay={site.phoneDisplay}
            phoneHref={site.phoneHref}
            whatsappHref={site.whatsappHref}
          />
        </div>
      </div>
    </header>
  );
}
