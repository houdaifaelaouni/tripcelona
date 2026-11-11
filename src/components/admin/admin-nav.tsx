"use client";

/**
 * Admin sidebar navigation, after Preline UI's application sidebar
 * (https://github.com/htmlstreamofficial/preline, MIT + Preline UI Fair Use
 * License). On large screens it is a fixed column; on smaller ones the
 * header's menu button opens it as a modal drawer (native <dialog>).
 */
import {
  CalendarCheck,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Map,
  Menu,
  Newspaper,
  Settings,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string; icon: LucideIcon; ownerOnly?: boolean };
const GROUPS: { label?: string; items: Item[] }[] = [
  { items: [{ href: "/admin", label: "Panel", icon: LayoutDashboard }] },
  {
    label: "Ventas",
    items: [
      { href: "/admin/excursiones", label: "Excursiones", icon: Map },
      { href: "/admin/reservas", label: "Reservas", icon: CalendarCheck, ownerOnly: true },
      { href: "/admin/solicitudes", label: "Solicitudes", icon: Inbox, ownerOnly: true },
    ],
  },
  {
    label: "Contenido",
    items: [
      { href: "/admin/blog", label: "Blog", icon: Newspaper },
      { href: "/admin/paginas", label: "Páginas", icon: FileText },
      { href: "/admin/faqs", label: "Preguntas frecuentes", icon: HelpCircle },
      { href: "/admin/medios", label: "Medios", icon: ImageIcon },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { href: "/admin/equipo", label: "Equipo", icon: Users, ownerOnly: true },
      { href: "/admin/ajustes", label: "Ajustes", icon: Settings, ownerOnly: true },
      { href: "/admin/cuenta", label: "Mi cuenta", icon: UserRound },
    ],
  },
];

const isActive = (path: string, href: string) =>
  href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`);

/** The section title for the current path (shown in the top bar). */
export function useSection() {
  const path = usePathname();
  for (const g of GROUPS) for (const i of g.items) if (isActive(path, i.href)) return i.label;
  return "Panel";
}

export function AdminNav({
  role,
  onNavigate,
}: {
  role: "owner" | "editor";
  onNavigate?: () => void;
}) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="px-3 pb-4">
      {GROUPS.map((g, gi) => {
        const items = g.items.filter((i) => role === "owner" || !i.ownerOnly);
        if (!items.length) return null;
        return (
          <div key={g.label ?? gi} className={cn(gi > 0 && "mt-5")}>
            {g.label && (
              <p className="mb-1 px-2.5 text-caption font-semibold tracking-wide text-muted uppercase">
                {g.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {items.map(({ href, label, icon: Icon }) => {
                const active = isActive(path, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-10 items-center gap-3 rounded-control px-2.5 py-2 text-meta text-ink transition-colors hover:bg-surface-alt",
                        active && "bg-blue/10 font-semibold text-navy hover:bg-blue/10",
                      )}
                    >
                      <Icon
                        aria-hidden
                        size={18}
                        className={cn("shrink-0", active ? "text-navy" : "text-muted")}
                      />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function SidebarBrand() {
  return (
    <Link href="/admin" className="flex items-center gap-2 rounded-control text-base font-semibold">
      <span
        aria-hidden
        className="flex size-8 items-center justify-center rounded-control bg-navy text-meta font-bold text-white"
      >
        T
      </span>
      Tripcelona <span className="font-normal text-muted">Admin</span>
    </Link>
  );
}

/** Menu button + drawer for screens narrower than the lg breakpoint. */
export function MobileNav({ role }: { role: "owner" | "editor" }) {
  const ref = useRef<HTMLDialogElement>(null);
  const path = usePathname();
  useEffect(() => ref.current?.close(), [path]);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="flex size-10 items-center justify-center rounded-control border border-border text-ink hover:bg-surface-alt lg:hidden"
      >
        <Menu aria-hidden size={20} />
        <span className="sr-only">Abrir menú</span>
      </button>
      <dialog
        ref={ref}
        aria-label="Menú del panel"
        onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
        className="m-0 h-dvh max-h-none w-72 max-w-[85vw] bg-white p-0 text-ink backdrop:bg-ink/40 open:flex open:flex-col"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <SidebarBrand />
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="flex size-10 items-center justify-center rounded-control hover:bg-surface-alt"
          >
            <X aria-hidden size={20} />
            <span className="sr-only">Cerrar menú</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pt-4">
          <AdminNav role={role} onNavigate={() => ref.current?.close()} />
        </div>
      </dialog>
    </>
  );
}

/** Current section name in the top bar. */
export function SectionTitle() {
  return <span className="truncate text-meta font-semibold">{useSection()}</span>;
}
