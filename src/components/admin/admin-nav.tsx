"use client";

import {
  CalendarCheck,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Map,
  Newspaper,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string; icon: LucideIcon; ownerOnly?: boolean };
const ITEMS: Item[] = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/excursiones", label: "Excursiones", icon: Map },
  { href: "/admin/reservas", label: "Reservas", icon: CalendarCheck, ownerOnly: true },
  { href: "/admin/solicitudes", label: "Solicitudes", icon: Inbox, ownerOnly: true },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/paginas", label: "Páginas", icon: FileText },
  { href: "/admin/faqs", label: "Preguntas frecuentes", icon: HelpCircle },
  { href: "/admin/medios", label: "Medios", icon: ImageIcon },
  { href: "/admin/equipo", label: "Equipo", icon: Users, ownerOnly: true },
  { href: "/admin/ajustes", label: "Ajustes", icon: Settings, ownerOnly: true },
  { href: "/admin/cuenta", label: "Mi cuenta", icon: UserRound },
];

/** Side navigation; a scrollable strip on phones. */
export function AdminNav({ role }: { role: "owner" | "editor" }) {
  const path = usePathname();
  return (
    <nav
      aria-label="Admin"
      className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0"
    >
      <ul className="flex w-max gap-1 md:w-auto md:flex-col">
        {ITEMS.filter((i) => role === "owner" || !i.ownerOnly).map(
          ({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-full px-3 text-meta font-semibold whitespace-nowrap text-white/80 transition-colors hover:bg-white/10 hover:text-white md:rounded-control",
                    active && "bg-white text-navy hover:bg-white hover:text-navy",
                  )}
                >
                  <Icon aria-hidden size={18} className="shrink-0" />
                  {label}
                </Link>
              </li>
            );
          },
        )}
      </ul>
    </nav>
  );
}
