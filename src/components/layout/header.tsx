import { ChevronDown, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";
import { getSiteContent } from "@/lib/site-content";
import { WhatsAppIcon } from "@/components/ui/icons";
import { iconButtonClasses } from "@/components/ui/icon-button";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { CartLink } from "@/components/cart/cart-link";
import { MobileNav } from "./mobile-nav";

/*
 * Untitled UI marketing header layout (MIT, see THIRD_PARTY_NOTICES.md):
 * white 64px bar with a hairline, wordmark left, nav centred, actions and
 * one blue primary CTA right.
 */
const navLink =
  "flex items-center gap-0.5 rounded-md px-3 py-1.5 text-sm font-medium text-tertiary transition-colors hover:bg-secondary hover:text-primary";
const action = iconButtonClasses(
  "soft",
  "md",
  "size-9 rounded-lg bg-primary text-fg-tertiary ring-1 ring-secondary ring-inset hover:bg-secondary hover:text-fg-primary",
);

export async function Header() {
  const [site, content] = await Promise.all([getSiteSettings(), getSiteContent()]);
  const primaryNav = content.nav;
  return (
    <header className="sticky top-0 z-40 transition-shadow duration-300 data-[scrolled=true]:shadow-sm border-b border-secondary bg-primary/85 text-primary backdrop-blur-md backdrop-saturate-150">
      <div className="container-site grid h-16 grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="flex items-center justify-self-start rounded-md">
          <Logo className="h-12" priority />
          <span className="sr-only"> - Excursiones en grupo por Cataluña, inicio</span>
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
                  <ul className="invisible absolute top-full left-0 mt-2 min-w-60 rounded-xl bg-primary p-1 text-secondary opacity-0 shadow-lg ring-1 ring-secondary transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary hover:text-primary"
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
            className="hidden items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-tertiary whitespace-nowrap hover:bg-secondary hover:text-primary 2xl:flex"
          >
            <Phone size={18} aria-hidden />
            <span>{site.phoneDisplay}</span>
          </a>
          <a
            href={site.phoneHref}
            className={cn(action, "hidden md:inline-flex 2xl:hidden")}
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
          <CartLink />
          <Link
            href="/ofertas-de-viajes"
            className={buttonClasses({ size: "sm" }, "hidden whitespace-nowrap md:inline-flex")}
          >
            Ver excursiones
          </Link>
          <MobileNav
            nav={primaryNav}
            phoneDisplay={site.phoneDisplay}
            phoneHref={site.phoneHref}
            whatsappHref={site.whatsappHref}
          />
        </div>
      </div>
    </header>
  );
}
