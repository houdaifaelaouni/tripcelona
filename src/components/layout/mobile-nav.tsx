"use client";

import Link from "@/components/i18n/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import type { NavLink } from "@/lib/site-content-shared";
import { Menu, Phone, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/icons";
import { iconButtonClasses } from "@/components/ui/icon-button";
import { useLocale, useT } from "@/components/i18n/provider";
import { LanguageLinks } from "./language-switcher";

export function MobileNav({
  nav: primaryNav,
  ...site
}: {
  nav: NavLink[];
  phoneDisplay: string;
  phoneHref: string;
  whatsappHref: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Menu entries slide in one after another each time the drawer opens.
  useGSAP(
    () => {
      if (!open) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("nav li, dialog > div:last-child a", {
          x: 24,
          opacity: 0,
          duration: 0.4,
          ease: "power3.out",
          stagger: 0.04,
          delay: 0.1,
          clearProps: "opacity,transform",
        });
      });
      return () => mm.revert();
    },
    { dependencies: [open], scope: dialogRef },
  );

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className={iconButtonClasses(
          "soft",
          "md",
          "size-9 rounded-lg bg-primary text-fg-tertiary ring-1 ring-secondary ring-inset hover:bg-secondary hover:text-fg-primary",
        )}
        aria-label={t("Abrir menú")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={18} aria-hidden />
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-label={t("Menú")}
        className="m-0 ml-auto h-dvh max-h-dvh w-[min(22rem,88vw)] max-w-none rounded-l-2xl bg-white p-0 text-primary backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
      >
        <div className="flex h-16 items-center justify-between border-b border-secondary px-6">
          <span className="text-lg font-semibold tracking-tight">{t("Menú")}</span>
          <button
            type="button"
            className={iconButtonClasses("soft", "md")}
            aria-label={t("Cerrar menú")}
            onClick={() => setOpen(false)}
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <nav
          aria-label={t("Principal (móvil)")}
          // Close the drawer when any link inside it is followed.
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <ul className="p-3">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 font-medium hover:bg-secondary"
                >
                  {t(item.label)}
                </Link>
                {item.children && (
                  <ul>
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-lg py-2.5 pr-3 pl-6 text-sm text-tertiary hover:bg-secondary hover:text-primary"
                        >
                          {t(child.label)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-secondary p-6">
          <p className="mb-3 text-sm font-medium text-tertiary">{t("Idioma")}</p>
          <LanguageLinks locale={locale} />
        </div>
        <div className="flex flex-col gap-2 border-t border-secondary p-6">
          <a
            href={site.phoneHref}
            className="flex items-center gap-2 py-2 font-medium text-brand-secondary"
          >
            <Phone size={18} aria-hidden /> {site.phoneDisplay}
          </a>
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-2 font-medium text-whatsapp"
          >
            <WhatsAppIcon /> WhatsApp
          </a>
        </div>
      </dialog>
    </div>
  );
}
