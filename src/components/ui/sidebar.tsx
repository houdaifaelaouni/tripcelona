"use client";

/**
 * shadcn-style Sidebar (the "sidebar-07" pattern: collapses to icons, rail,
 * trigger, mobile sheet), rebuilt on React Aria + Tailwind so it matches the
 * admin's Untitled UI tokens instead of pulling in Radix.
 *
 * - Desktop (lg+): fixed sidebar, 16rem wide or 3rem when collapsed to
 *   icons. State persists in the `admin_sidebar` cookie; Ctrl/⌘+B toggles.
 * - Below lg: hidden; SidebarTrigger opens it as a sheet from the left.
 * - The wrapper exposes `--sidebar-offset` (current desktop width) so fixed
 *   elements in pages can sit next to it: `lg:left-(--sidebar-offset)`.
 */
import { PanelLeftIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import type {
  ButtonProps as AriaButtonProps,
  LinkProps as AriaLinkProps,
} from "react-aria-components";
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  Link as AriaLink,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import { Tooltip } from "@/components/uui/base/tooltip/tooltip";
import { cx } from "@/components/uui/utils/cx";
import { SIDEBAR_COOKIE } from "./sidebar-cookie";

const WIDTH = "16rem";
const WIDTH_ICON = "3rem";
const MOBILE_QUERY = "(max-width: 1023.98px)";

type SidebarCtx = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  /** True only on desktop when the sidebar shows icons only. */
  collapsed: boolean;
  toggleSidebar: () => void;
};

const Ctx = createContext<SidebarCtx | null>(null);

export function useSidebar() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider.");
  return ctx;
}

function subscribeMobile(cb: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function SidebarProvider({
  defaultOpen = true,
  className,
  children,
}: {
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
  const [open, setOpenState] = useState(defaultOpen);
  const [openMobile, setOpenMobile] = useState(false);

  const setOpen = useCallback((value: boolean) => {
    setOpenState(value);
    document.cookie = `${SIDEBAR_COOKIE}=${value}; path=/admin; max-age=31536000; samesite=lax`;
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isMobile) setOpenMobile((o) => !o);
    else setOpen(!open);
  }, [isMobile, open, setOpen]);

  // Ctrl/⌘ + B toggles the sidebar (same shortcut as shadcn).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey) && !e.altKey) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleSidebar]);

  // Close the mobile sheet after navigating.
  const path = usePathname();
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setOpenMobile(false);
  }

  const value = useMemo<SidebarCtx>(
    () => ({
      state: open ? "expanded" : "collapsed",
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      collapsed: !open && !isMobile,
      toggleSidebar,
    }),
    [open, setOpen, openMobile, isMobile, toggleSidebar],
  );

  return (
    <Ctx.Provider value={value}>
      <div
        data-state={value.state}
        style={
          {
            "--sidebar-width": WIDTH,
            "--sidebar-width-icon": WIDTH_ICON,
            "--sidebar-offset": open ? WIDTH : WIDTH_ICON,
          } as CSSProperties
        }
        className={cx("group/sidebar-wrapper flex min-h-svh w-full", className)}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

const panel = "flex h-full w-full flex-col bg-secondary text-secondary";

export function Sidebar({ children, label = "Menú" }: { children: ReactNode; label?: string }) {
  const { state, openMobile, setOpenMobile } = useSidebar();
  return (
    <>
      <AriaModalOverlay
        isOpen={openMobile}
        onOpenChange={setOpenMobile}
        isDismissable
        className={({ isEntering, isExiting }) =>
          cx(
            "fixed inset-0 z-50 bg-overlay/60 backdrop-blur-sm lg:hidden",
            isEntering && "duration-200 ease-out animate-in fade-in",
            isExiting && "duration-150 ease-in animate-out fade-out",
          )
        }
      >
        <AriaModal
          className={({ isEntering, isExiting }) =>
            cx(
              "fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl",
              isEntering && "duration-200 ease-out animate-in slide-in-from-left",
              isExiting && "duration-150 ease-in animate-out slide-out-to-left",
            )
          }
        >
          <AriaDialog aria-label={label} className="h-dvh outline-hidden" data-sidebar="mobile">
            <div className={panel}>{children}</div>
          </AriaDialog>
        </AriaModal>
      </AriaModalOverlay>

      <div
        className="group peer hidden lg:block print:hidden"
        data-state={state}
        data-collapsible={state === "collapsed" ? "icon" : ""}
      >
        <aside
          aria-label={label}
          className="fixed inset-y-0 left-0 z-40 flex h-svh w-(--sidebar-width) border-r border-secondary transition-[width] duration-200 ease-linear group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
        >
          <div className={panel}>{children}</div>
        </aside>
      </div>
    </>
  );
}

export function SidebarInset({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cx(
        "relative flex min-w-0 flex-1 flex-col bg-primary transition-[padding] duration-200 ease-linear lg:pl-(--sidebar-offset) print:pl-0",
        className,
      )}
    />
  );
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggleSidebar, open, isMobile } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={isMobile ? "Abrir menú" : open ? "Contraer menú" : "Expandir menú"}
      title="Menú (Ctrl+B)"
      className={cx(
        "inline-flex size-8 items-center justify-center rounded-md text-fg-quaternary outline-focus-ring transition hover:bg-primary_hover hover:text-fg-secondary focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
    >
      <PanelLeftIcon aria-hidden className="size-4" />
    </button>
  );
}

/** Thin strip on the sidebar's right edge: click to collapse/expand. */
export function SidebarRail() {
  const { toggleSidebar, open } = useSidebar();
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={toggleSidebar}
      aria-label={open ? "Contraer menú" : "Expandir menú"}
      title={open ? "Contraer" : "Expandir"}
      className="absolute inset-y-0 -right-2 z-20 hidden w-4 cursor-w-resize after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:transition-colors hover:after:bg-border-primary lg:flex group-data-[collapsible=icon]:cursor-e-resize"
    />
  );
}

export function SidebarHeader({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cx("flex flex-col gap-2 p-2", className)} />;
}

export function SidebarFooter({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cx("flex flex-col gap-2 p-2", className)} />;
}

export function SidebarSeparator({ className }: { className?: string }) {
  return <hr className={cx("mx-2 border-secondary", className)} />;
}

export function SidebarContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cx(
        "flex min-h-0 flex-1 flex-col gap-1 overflow-auto group-data-[collapsible=icon]:overflow-x-hidden",
        className,
      )}
    />
  );
}

export function SidebarGroup({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cx("relative flex w-full min-w-0 flex-col p-2", className)} />;
}

export function SidebarGroupLabel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cx(
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium whitespace-nowrap text-quaternary transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className,
      )}
    />
  );
}

export function SidebarMenu({ className, ...props }: ComponentProps<"ul">) {
  return <ul {...props} className={cx("flex w-full min-w-0 flex-col gap-0.5", className)} />;
}

export function SidebarMenuItem({ className, ...props }: ComponentProps<"li">) {
  return <li {...props} className={cx("group/menu-item relative", className)} />;
}

const buttonBase =
  "peer/menu-button flex w-full cursor-pointer items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm font-medium text-secondary outline-focus-ring transition-[width,height,padding] duration-200 ease-linear select-none hover:bg-primary_hover hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 data-[active=true]:bg-primary data-[active=true]:text-primary data-[active=true]:shadow-xs data-[active=true]:ring-1 data-[active=true]:ring-secondary data-[active=true]:ring-inset pressed:bg-primary_hover [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-fg-quaternary data-[active=true]:[&>svg]:text-fg-brand-primary group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!";
const buttonSizes = {
  default: "h-8",
  lg: "h-12 group-data-[collapsible=icon]:p-0!",
};

type MenuButtonCommon = {
  isActive?: boolean;
  size?: keyof typeof buttonSizes;
  /** Shown as a tooltip when the sidebar is collapsed to icons. */
  tooltip?: string;
  className?: string;
  children: ReactNode;
};

/**
 * A sidebar row. With `href` it renders a link, otherwise a React Aria button
 * (so it can be the trigger of a DropdownMenu or a Collapsible).
 */
export function SidebarMenuButton(
  props: MenuButtonCommon &
    (
      | ({ href: string } & Omit<AriaLinkProps, "children" | "className" | "href">)
      | ({ href?: undefined } & Omit<AriaButtonProps, "children" | "className">)
    ),
) {
  const { isActive, size = "default", tooltip, className, children, ...rest } = props;
  const { collapsed } = useSidebar();
  const cls = cx(buttonBase, buttonSizes[size], className);
  const el =
    rest.href !== undefined ? (
      <AriaLink
        {...(rest as AriaLinkProps)}
        data-active={isActive || undefined}
        aria-current={isActive ? "page" : undefined}
        className={cls}
      >
        {children}
      </AriaLink>
    ) : (
      <AriaButton
        {...(rest as AriaButtonProps)}
        data-active={isActive || undefined}
        className={cls}
      >
        {children}
      </AriaButton>
    );
  if (!tooltip) return el;
  return (
    <Tooltip title={tooltip} placement="right" isDisabled={!collapsed} delay={0}>
      {el}
    </Tooltip>
  );
}

export function SidebarMenuSub({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      {...props}
      className={cx(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-0.5 border-l border-secondary px-2.5 py-0.5 group-data-[collapsible=icon]:hidden",
        className,
      )}
    />
  );
}

export function SidebarMenuSubItem({ className, ...props }: ComponentProps<"li">) {
  return <li {...props} className={cx("group/menu-sub-item relative", className)} />;
}

export function SidebarMenuSubButton({
  isActive,
  className,
  children,
  ...props
}: Omit<AriaLinkProps, "className" | "children"> & {
  isActive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <AriaLink
      {...props}
      data-active={isActive || undefined}
      aria-current={isActive ? "page" : undefined}
      className={cx(
        "flex h-7 min-w-0 -translate-x-px cursor-pointer items-center gap-2 overflow-hidden rounded-md px-2 text-sm text-tertiary outline-focus-ring hover:bg-primary_hover hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 data-[active=true]:bg-primary data-[active=true]:font-medium data-[active=true]:text-brand-secondary data-[active=true]:shadow-xs data-[active=true]:ring-1 data-[active=true]:ring-secondary data-[active=true]:ring-inset [&>span:last-child]:truncate",
        className,
      )}
    >
      {children}
    </AriaLink>
  );
}
