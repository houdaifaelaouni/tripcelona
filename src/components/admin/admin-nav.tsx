"use client";

/**
 * Admin navigation, laid out like shadcn's "sidebar-07": a sidebar that
 * collapses to icons (rail + Ctrl/⌘+B), a brand menu at the top, collapsible
 * section groups with their pages underneath, and the signed-in account menu
 * at the bottom. Below lg it becomes a sheet opened from the top bar.
 */
import {
  ChevronRightIcon,
  ChevronsUpDownIcon,
  ExternalLinkIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MegaphoneIcon,
  Settings2Icon,
  SettingsIcon,
  TicketIcon,
  UserIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { RouterProvider } from "react-aria-components";
import { Logo } from "@/components/brand/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/admin/auth-actions";

type Page = { href: string; label: string; ownerOnly?: boolean };
type Section = { label: string; icon: LucideIcon; href?: string; pages?: Page[] };

/** Every admin page, grouped by what the team does with it. */
const NAV: Section[] = [
  { label: "Panel", icon: LayoutDashboardIcon, href: "/admin" },
  {
    label: "Ventas",
    icon: TicketIcon,
    pages: [
      { href: "/admin/excursiones", label: "Excursiones" },
      { href: "/admin/reservas", label: "Reservas", ownerOnly: true },
      { href: "/admin/solicitudes", label: "Solicitudes", ownerOnly: true },
    ],
  },
  {
    label: "Marketing",
    icon: MegaphoneIcon,
    pages: [
      { href: "/admin/integraciones", label: "Integraciones" },
      { href: "/admin/landings", label: "Landings" },
    ],
  },
  {
    label: "Contenido",
    icon: FileTextIcon,
    pages: [
      { href: "/admin/inicio", label: "Página de inicio" },
      { href: "/admin/navegacion", label: "Menú y pie" },
      { href: "/admin/blog", label: "Blog" },
      { href: "/admin/paginas", label: "Páginas" },
      { href: "/admin/faqs", label: "Preguntas frecuentes" },
      { href: "/admin/opiniones", label: "Opiniones" },
      { href: "/admin/medios", label: "Medios" },
      { href: "/admin/traducciones", label: "Traducciones" },
    ],
  },
  {
    label: "Operaciones",
    icon: WalletIcon,
    pages: [
      { href: "/admin/pagos", label: "Pagos", ownerOnly: true },
      { href: "/admin/actividad", label: "Actividad", ownerOnly: true },
      { href: "/admin/redirecciones", label: "Redirecciones", ownerOnly: true },
      { href: "/admin/avisos", label: "Avisos", ownerOnly: true },
    ],
  },
  {
    label: "Configuración",
    icon: Settings2Icon,
    pages: [
      { href: "/admin/equipo", label: "Equipo", ownerOnly: true },
      { href: "/admin/ajustes", label: "Ajustes", ownerOnly: true },
      { href: "/admin/cuenta", label: "Mi cuenta" },
    ],
  },
];

/** Pages without their own menu entry, shown under a parent in the top bar. */
const DETAIL_PARENTS: Record<string, string> = {
  "/admin/salidas": "/admin/excursiones",
  "/admin/billetes": "/admin/reservas",
};

const isActive = (path: string, href: string) =>
  href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`);

type Staff = { role: "owner" | "editor"; email: string; name: string | null };

function visibleNav(role: Staff["role"]) {
  return NAV.map((s) => ({
    ...s,
    pages: s.pages?.filter((p) => role === "owner" || !p.ownerOnly),
  })).filter((s) => s.href || s.pages?.length);
}

/** Section + page for the top bar, e.g. "Ventas / Reservas". */
function crumbs(path: string, nav: Section[]): [string, string | null] {
  const parent = Object.entries(DETAIL_PARENTS).find(([p]) => path.startsWith(`${p}/`))?.[1];
  const target = parent ?? path;
  for (const s of nav) {
    if (s.href && isActive(target, s.href)) return [s.label, null];
    const page = s.pages?.find((p) => isActive(target, p.href));
    if (page) return [s.label, page.label];
  }
  return ["Panel", null];
}

/** React Aria links navigate with the Next router (client-side). */
export function AdminRouter({ children }: { children: ReactNode }) {
  const router = useRouter();
  return <RouterProvider navigate={(href) => router.push(href)}>{children}</RouterProvider>;
}

/** The owner's logo, unchanged, with an "Admin" tag (also used on the login screens). */
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

function BrandMenu() {
  const { isMobile } = useSidebar();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <SidebarMenuButton size="lg">
            <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary ring-1 ring-secondary ring-inset">
              <Logo className="h-auto w-7" />
            </span>
            <span className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-primary">Tripcelona</span>
              <span className="truncate text-xs text-tertiary">Panel de administración</span>
            </span>
            <ChevronsUpDownIcon aria-hidden className="ml-auto" />
          </SidebarMenuButton>
          <DropdownMenuContent
            aria-label="Tripcelona"
            placement={isMobile ? "bottom start" : "right top"}
          >
            <DropdownMenuGroup label="Tripcelona">
              <DropdownMenuItem href="/admin" icon={LayoutDashboardIcon}>
                Ir al panel
              </DropdownMenuItem>
              <DropdownMenuItem href="/" target="_blank" icon={ExternalLinkIcon}>
                Ver la web
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function NavMain({ nav }: { nav: Section[] }) {
  const path = usePathname();
  const { collapsed } = useSidebar();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Gestión</SidebarGroupLabel>
      <SidebarMenu>
        {nav.map((section) => {
          const Icon = section.icon;
          if (section.href) {
            return (
              <SidebarMenuItem key={section.label}>
                <SidebarMenuButton
                  href={section.href}
                  tooltip={section.label}
                  isActive={isActive(path, section.href)}
                >
                  <Icon aria-hidden />
                  <span>{section.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }
          const pages = section.pages ?? [];
          const open = pages.some((p) => isActive(path, p.href));

          // Collapsed to icons: the section opens its pages in a flyout.
          if (collapsed) {
            return (
              <SidebarMenuItem key={section.label}>
                <DropdownMenu>
                  <SidebarMenuButton isActive={open} aria-label={section.label}>
                    <Icon aria-hidden />
                    <span>{section.label}</span>
                  </SidebarMenuButton>
                  <DropdownMenuContent
                    aria-label={section.label}
                    placement="right top"
                    offset={10}
                    className="min-w-48"
                  >
                    <DropdownMenuGroup label={section.label}>
                      {pages.map((p) => (
                        <DropdownMenuItem
                          key={p.href}
                          href={p.href}
                          className={isActive(path, p.href) ? "text-brand-secondary" : undefined}
                        >
                          {p.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            );
          }

          return (
            <SidebarMenuItem key={section.label}>
              <Collapsible defaultExpanded={open}>
                <SidebarMenuButton slot="trigger" tooltip={section.label}>
                  <Icon aria-hidden className={open ? "text-fg-brand-primary!" : undefined} />
                  <span className={open ? "text-primary" : undefined}>{section.label}</span>
                  <ChevronRightIcon
                    aria-hidden
                    className="ml-auto transition-transform duration-200 group-data-expanded/collapsible:rotate-90"
                  />
                </SidebarMenuButton>
                <CollapsibleContent>
                  <SidebarMenuSub className="mt-0.5">
                    {pages.map((p) => (
                      <SidebarMenuSubItem key={p.href}>
                        <SidebarMenuSubButton href={p.href} isActive={isActive(path, p.href)}>
                          <span>{p.label}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavShortcuts() {
  return (
    <SidebarGroup className="mt-auto">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton href="/" target="_blank" tooltip="Ver la web">
            <ExternalLinkIcon aria-hidden />
            <span>Ver la web</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

function initials(staff: Staff) {
  const base = staff.name?.trim() || staff.email;
  const parts = base.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (staff.name ? (parts[1]?.[0] ?? "") : "")).toUpperCase() || "A";
}

function NavUser({ staff }: { staff: Staff }) {
  const { isMobile } = useSidebar();
  const [pending, startTransition] = useTransition();
  const name = staff.name?.trim() || staff.email.split("@")[0];
  const role = staff.role === "owner" ? "Propietario" : "Editor";
  const card = (
    <>
      <Avatar className="size-8 rounded-lg">
        <AvatarFallback className="rounded-lg">{initials(staff)}</AvatarFallback>
      </Avatar>
      <span className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold text-primary">{name}</span>
        <span className="truncate text-xs text-tertiary">{staff.email}</span>
      </span>
    </>
  );
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <SidebarMenuButton size="lg">
            {card}
            <ChevronsUpDownIcon aria-hidden className="ml-auto" />
          </SidebarMenuButton>
          <DropdownMenuContent
            aria-label="Cuenta"
            placement={isMobile ? "top" : "right bottom"}
            className="min-w-60"
          >
            <DropdownMenuLabel className="flex items-center gap-2 px-2.5">
              {card}
              <span className="rounded-md bg-tertiary px-1.5 py-0.5 text-[11px] font-medium text-tertiary">
                {role}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem href="/admin/cuenta" icon={UserIcon}>
              Mi cuenta
            </DropdownMenuItem>
            {staff.role === "owner" ? (
              <DropdownMenuItem href="/admin/ajustes" icon={SettingsIcon}>
                Ajustes
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem href="/" target="_blank" icon={ExternalLinkIcon}>
              Ver la web
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              icon={LogOutIcon}
              isDisabled={pending}
              onAction={() => startTransition(() => signOut())}
            >
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function TopBar({ nav }: { nav: Section[] }) {
  const path = usePathname();
  const [section, page] = crumbs(path, nav);
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-secondary bg-primary/90 px-4 backdrop-blur transition-[height] duration-200 ease-linear md:px-6 lg:group-data-[state=collapsed]/sidebar-wrapper:h-12 print:hidden">
      <SidebarTrigger className="-ml-1" />
      <span aria-hidden className="mx-1 h-4 w-px bg-border-secondary" />
      <nav aria-label="Ruta" className="min-w-0 text-sm">
        <ol className="flex items-center gap-1.5 truncate">
          <li className={page ? "hidden text-tertiary sm:block" : "font-medium text-primary"}>
            {section}
          </li>
          {page ? (
            <>
              <li aria-hidden className="hidden text-quaternary sm:block">
                /
              </li>
              <li className="truncate font-medium text-primary">{page}</li>
            </>
          ) : null}
        </ol>
      </nav>
      <Link href="/admin" className="ml-auto rounded-md lg:hidden" aria-label="Tripcelona, panel">
        <Logo className="h-8" />
      </Link>
    </header>
  );
}

/** The whole admin frame: sidebar + top bar + page content. */
export function AdminShell({
  staff,
  defaultOpen,
  children,
}: {
  staff: Staff;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const nav = visibleNav(staff.role);
  return (
    <AdminRouter>
      <SidebarProvider defaultOpen={defaultOpen}>
        <Sidebar label="Menú del panel">
          <SidebarHeader>
            <BrandMenu />
          </SidebarHeader>
          <SidebarContent>
            <NavMain nav={nav} />
            <NavShortcuts />
          </SidebarContent>
          <SidebarFooter>
            <NavUser staff={staff} />
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <TopBar nav={nav} />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </AdminRouter>
  );
}
