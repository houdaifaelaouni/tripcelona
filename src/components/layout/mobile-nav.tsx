"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { primaryNav } from "@/lib/site";
import { CloseIcon, MenuIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";

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
        className="flex items-center rounded-control p-2 hover:bg-white/10"
        aria-label="Abrir menú"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-label="Menú"
        className="m-0 ml-auto h-dvh max-h-dvh w-[min(20rem,85vw)] max-w-none bg-white p-0 text-ink backdrop:bg-ink/50"
      >
        <div className="flex h-16 items-center justify-between bg-navy px-4 text-white">
          <span className="text-lg font-bold">Menú</span>
          <button
            type="button"
            className="rounded-control p-2 hover:bg-white/10"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>
        <nav
          aria-label="Principal (móvil)"
          // Close the drawer when any link inside it is followed.
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <ul className="py-2">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block px-4 py-3 font-bold hover:bg-surface-alt">
                  {item.label}
                </Link>
                {item.children && (
                  <ul>
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block py-2.5 pr-4 pl-8 hover:bg-surface-alt"
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
        <div className="flex flex-col gap-2 border-t border-border p-4">
          <a href={site.phoneHref} className="flex items-center gap-2 py-2 font-bold text-blue">
            <PhoneIcon /> {site.phoneDisplay}
          </a>
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-2 font-bold text-whatsapp"
          >
            <WhatsAppIcon /> WhatsApp
          </a>
        </div>
      </dialog>
    </div>
  );
}
