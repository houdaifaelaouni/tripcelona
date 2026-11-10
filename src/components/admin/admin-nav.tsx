"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string; ownerOnly?: boolean };
const ITEMS: Item[] = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/excursiones", label: "Excursiones" },
  { href: "/admin/reservas", label: "Reservas", ownerOnly: true },
  { href: "/admin/solicitudes", label: "Solicitudes", ownerOnly: true },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/paginas", label: "Páginas" },
  { href: "/admin/faqs", label: "Preguntas frecuentes" },
  { href: "/admin/medios", label: "Medios" },
  { href: "/admin/equipo", label: "Equipo", ownerOnly: true },
  { href: "/admin/ajustes", label: "Ajustes", ownerOnly: true },
  { href: "/admin/cuenta", label: "Mi cuenta" },
];

export function AdminNav({ role }: { role: "owner" | "editor" }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin">
      <ul className="flex flex-wrap gap-1 md:flex-col">
        {ITEMS.filter((i) => role === "owner" || !i.ownerOnly).map((item) => {
          const active = item.href === "/admin" ? path === "/admin" : path.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-control px-3 py-2 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white",
                  active && "bg-white/15 text-white",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
