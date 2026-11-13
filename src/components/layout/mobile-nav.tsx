"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { primaryNav } from "@/lib/site";
import { Menu, Phone, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/icons";
import { iconButtonClasses } from "@/components/ui/icon-button";

export function MobileNav(site: { phoneDisplay: string; phoneHref: string; whatsappHref: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className={iconButtonClasses(
          "soft",
          "md",
          "size-9 rounded-lg bg-primary text-fg-tertiary ring-1 ring-secondary ring-inset hover:bg-secondary hover:text-fg-primary",
        )}
        aria-label="Abrir menú"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={18} aria-hidden />
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-label="Menú"
        className="m-0 ml-auto h-dvh max-h-dvh w-[min(22rem,88vw)] max-w-none rounded-l-2xl bg-white p-0 text-primary backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
      >
        <div className="flex h-16 items-center justify-between border-b border-secondary px-6">
          <span className="text-lg font-semibold tracking-tight">Menú</span>
          <button
            type="button"
            className={iconButtonClasses("soft", "md")}
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <nav
          aria-label="Principal (móvil)"
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
                  {item.label}
                </Link>
                {item.children && (
                  <ul>
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-lg py-2.5 pr-3 pl-6 text-sm text-tertiary hover:bg-secondary hover:text-primary"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
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
