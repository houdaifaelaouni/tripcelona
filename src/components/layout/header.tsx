import { ChevronDown, Phone, Ticket } from "lucide-react";
import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";
import { primaryNav } from "@/lib/site";
import { WhatsAppIcon } from "@/components/ui/icons";
import { iconButtonClasses } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { MobileNav } from "./mobile-nav";

/*
 * 80px top bar (design rule): wordmark left, navigation centred, actions
 * right. Tripcelona navy stays the bar colour.
 */
const navLink =
  "flex items-center gap-1 rounded-full px-4 py-2 font-semibold transition-colors hover:bg-white/10";
const action = iconButtonClasses("soft", "md", "bg-white/10 text-white hover:bg-white/20");

export async function Header() {
  const site = await getSiteSettings();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy text-white">
      <div className="container-site grid h-20 grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
        {/* TODO(PO): replace the wordmark with the SVG logo (access checklist). */}
        <Link
          href="/"
          className="justify-self-start text-display-sm font-bold tracking-tight"
          aria-label="Tripcelona - Excursiones en grupo por Cataluña, inicio"
        >
          Tripcelona
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) =>
              item.children ? (
                <li key={item.href} className="group relative">
                  <Link href={item.href} className={navLink}>
                    {item.label}
                    <ChevronDown
                      size={16}
                      aria-hidden
                      className="transition-transform group-focus-within:rotate-180 group-hover:rotate-180 motion-reduce:transition-none"
                    />
                  </Link>
                  {/* Opens on hover and on keyboard focus inside the item. */}
                  <ul className="invisible absolute top-full left-0 mt-2 min-w-56 rounded-card border border-border bg-white p-2 text-ink opacity-0 shadow-float transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-control px-3 py-2.5 hover:bg-surface-alt"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.href}>
                  <Link href={item.href} className={navLink}>
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex items-center justify-self-end gap-2">
          <a
            href={site.phoneHref}
            className="hidden items-center gap-2 rounded-full px-4 py-2 font-semibold hover:bg-white/10 xl:flex"
          >
            <Phone size={18} aria-hidden />
            <span>{site.phoneDisplay}</span>
          </a>
          <a
            href={site.phoneHref}
            className={cn(action, "hidden md:inline-flex xl:hidden")}
            aria-label={`Llamar al ${site.phoneDisplay}`}
          >
            <Phone size={18} aria-hidden />
          </a>
          <a
            href={site.whatsappHref}
            className={action}
            aria-label="Escríbenos por WhatsApp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon />
          </a>
          <Link href="/reservar" className={action} aria-label="Mi reserva">
            <Ticket size={18} aria-hidden />
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
