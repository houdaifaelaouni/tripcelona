"use client";

/**
 * Admin sidebar: the Untitled UI "sections with subheadings" sidebar
 * (MIT, © 2025 Untitled UI, https://github.com/untitleduico/react,
 * application/app-navigation) with Tripcelona's brand, nav groups and an
 * account card. Phones and tablets get the Untitled mobile header + drawer.
 */
import {
  BarChartSquare02,
  BookOpen01,
  Calendar,
  File04,
  HelpCircle,
  Image01,
  Inbox01,
  LinkExternal01,
  LogOut01,
  Map01,
  Menu02,
  MessageSquare01,
  Settings01,
  User01,
  Users01,
  X as CloseIcon,
} from "@untitledui/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  RouterProvider,
} from "react-aria-components";
import { NavItemBase } from "@/components/uui/application/app-navigation/base-components/nav-item";
import { Avatar } from "@/components/uui/base/avatar/avatar";
import { cx } from "@/components/uui/utils/cx";
import { signOut } from "@/lib/admin/auth-actions";
import { Logo } from "@/components/brand/logo";

type Item = { href: string; label: string; icon: typeof Map01; ownerOnly?: boolean };
const GROUPS: { label: string; items: Item[] }[] = [
  { label: "General", items: [{ href: "/admin", label: "Panel", icon: BarChartSquare02 }] },
  {
    label: "Ventas",
    items: [
      { href: "/admin/excursiones", label: "Excursiones", icon: Map01 },
      { href: "/admin/reservas", label: "Reservas", icon: Calendar, ownerOnly: true },
      { href: "/admin/solicitudes", label: "Solicitudes", icon: Inbox01, ownerOnly: true },
    ],
  },
  {
    label: "Contenido",
    items: [
      { href: "/admin/blog", label: "Blog", icon: BookOpen01 },
      { href: "/admin/paginas", label: "Páginas", icon: File04 },
      { href: "/admin/faqs", label: "Preguntas frecuentes", icon: HelpCircle },
      { href: "/admin/opiniones", label: "Opiniones", icon: MessageSquare01 },
      { href: "/admin/medios", label: "Medios", icon: Image01 },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { href: "/admin/equipo", label: "Equipo", icon: Users01, ownerOnly: true },
      { href: "/admin/ajustes", label: "Ajustes", icon: Settings01, ownerOnly: true },
      { href: "/admin/cuenta", label: "Mi cuenta", icon: User01 },
    ],
  },
];

const isActive = (path: string, href: string) =>
  href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`);

/** React Aria links navigate with the Next router (client-side). */
export function AdminRouter({ children }: { children: ReactNode }) {
  const router = useRouter();
  return <RouterProvider navigate={(href) => router.push(href)}>{children}</RouterProvider>;
}

export function SidebarBrand() {
  return (
    <Link href="/admin" className="flex items-center gap-2 rounded-md">
      <Logo className="h-10" />
      <span className="rounded-md bg-tertiary px-1.5 py-0.5 text-[11px] font-medium text-tertiary">
        Admin
      </span>
    </Link>
  );
}

type Staff = { role: "owner" | "editor"; email: string; name: string | null };

function SidebarContent({ staff }: { staff: Staff }) {
  const path = usePathname();
  return (
    <aside className="flex h-full w-full max-w-full flex-col overflow-auto bg-secondary pt-5 lg:w-[248px] lg:border-r lg:border-secondary">
      <div className="px-5">
        <SidebarBrand />
      </div>
      <nav aria-label="Admin" className="mt-6">
        <ul>
          {GROUPS.map((group) => {
            const items = group.items.filter((i) => staff.role === "owner" || !i.ownerOnly);
            if (!items.length) return null;
            return (
              <li key={group.label}>
                <p className="px-5 pb-1.5 text-[11px] font-medium tracking-[0.06em] text-quaternary uppercase">
                  {group.label}
                </p>
                <ul className="px-3 pb-5">
                  {items.map((item) => (
                    <li key={item.href} className="py-px">
                      <NavItemBase
                        type="link"
                        href={item.href}
                        icon={item.icon}
                        current={isActive(path, item.href)}
                      >
                        {item.label}
                      </NavItemBase>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto flex flex-col gap-3 px-3 pb-3">
        <NavItemBase type="link" href="/" icon={LinkExternal01} target="_blank">
          Ver web
        </NavItemBase>
        <div className="relative flex items-center gap-3 rounded-lg bg-primary p-2.5 ring-1 ring-secondary ring-inset">
          <Avatar size="md" initials={(staff.name ?? staff.email).slice(0, 1).toUpperCase()} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-primary" title={staff.email}>
              {staff.name ?? staff.email}
            </p>
            <p className="truncate text-sm text-tertiary">
              {staff.role === "owner" ? "Propietario" : "Editor"}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex size-9 items-center justify-center rounded-md text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover"
            >
              <LogOut01 aria-hidden className="size-5" />
              <span className="sr-only">Salir</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

/** Fixed sidebar from lg up; mobile header with a drawer below lg. */
export function AdminSidebar({ staff }: { staff: Staff }) {
  const content = <SidebarContent staff={staff} />;
  return (
    <>
      <AriaDialogTrigger>
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-secondary bg-primary p-3 pl-4 lg:hidden">
          <SidebarBrand />
          <AriaButton
            aria-label="Abrir menú"
            className="group flex items-center justify-center rounded-lg bg-primary p-2 text-fg-secondary outline-focus-ring hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Menu02 aria-hidden className="size-6" />
          </AriaButton>
        </header>
        <AriaModalOverlay
          isDismissable
          className={({ isEntering, isExiting }) =>
            cx(
              "fixed inset-0 z-50 cursor-pointer bg-overlay/70 pr-16 backdrop-blur-md lg:hidden",
              isEntering && "duration-300 ease-in-out animate-in fade-in",
              isExiting && "duration-200 ease-in-out animate-out fade-out",
            )
          }
        >
          {({ state }) => (
            <>
              <AriaButton
                aria-label="Cerrar menú"
                onPress={() => state.close()}
                className="fixed top-2.5 right-3 flex cursor-pointer items-center justify-center rounded-lg p-2 text-fg-white/70 hover:bg-primary/10 hover:text-fg-white"
              >
                <CloseIcon aria-hidden className="size-6" />
              </AriaButton>
              <AriaModal className="w-full max-w-74 cursor-auto">
                <AriaDialog aria-label="Menú del panel" className="h-dvh outline-hidden">
                  {content}
                </AriaDialog>
              </AriaModal>
            </>
          )}
        </AriaModalOverlay>
      </AriaDialogTrigger>
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex">{content}</div>
    </>
  );
}
