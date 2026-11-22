"use client";

/**
 * shadcn-style DropdownMenu built on React Aria's MenuTrigger + Popover + Menu.
 * Put any React Aria Button (for example SidebarMenuButton) inside
 * <DropdownMenu> before <DropdownMenuContent>: React Aria wires it as the trigger.
 */
import type { ComponentType, ReactNode } from "react";
import type {
  MenuItemProps,
  MenuTriggerProps,
  PopoverProps,
  SeparatorProps,
} from "react-aria-components";
import {
  Header,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  Popover,
  Separator,
} from "react-aria-components";
import { cx } from "@/components/uui/utils/cx";

export function DropdownMenu(props: MenuTriggerProps) {
  return <MenuTrigger {...props} />;
}

export function DropdownMenuContent({
  children,
  className,
  placement = "bottom start",
  offset = 4,
  "aria-label": ariaLabel,
  ...props
}: Omit<PopoverProps, "children" | "className"> & {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Popover
      {...props}
      placement={placement}
      offset={offset}
      className={({ isEntering, isExiting }) =>
        cx(
          "z-50 min-w-56 origin-(--trigger-anchor-point) overflow-auto rounded-lg bg-primary py-1 shadow-lg ring-1 ring-secondary outline-hidden will-change-transform",
          isEntering && "duration-150 ease-out animate-in fade-in zoom-in-95",
          isExiting && "duration-100 ease-in animate-out fade-out zoom-out-95",
          className,
        )
      }
    >
      <Menu aria-label={ariaLabel} className="outline-hidden">
        {children}
      </Menu>
    </Popover>
  );
}

/** A labelled, non-interactive block at the top of a menu (for example the user card). */
export function DropdownMenuGroup({
  label,
  children,
  className,
}: {
  label?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <MenuSection className={className}>
      {label ? (
        <Header className="px-3 py-1.5 text-xs font-medium text-quaternary">{label}</Header>
      ) : null}
      {children}
    </MenuSection>
  );
}

export function DropdownMenuLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <MenuSection>
      <Header className={cx("px-3 py-1.5 text-sm", className)}>{children}</Header>
    </MenuSection>
  );
}

export function DropdownMenuItem({
  icon: Icon,
  children,
  className,
  variant = "default",
  ...props
}: Omit<MenuItemProps, "children" | "className"> & {
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: ReactNode;
  className?: string;
  variant?: "default" | "destructive";
}) {
  return (
    <MenuItem
      textValue={typeof children === "string" ? children : undefined}
      {...props}
      className={({ isFocused, isFocusVisible, isDisabled }) =>
        cx(
          "mx-1.5 my-px flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-secondary outline-hidden select-none",
          isFocused && "bg-primary_hover text-primary",
          isFocusVisible && "outline-2 -outline-offset-2 outline-focus-ring",
          isDisabled && "cursor-not-allowed opacity-50",
          variant === "destructive" && "text-error-primary",
          className,
        )
      }
    >
      {Icon ? (
        <Icon
          aria-hidden
          className={cx(
            "size-4 shrink-0",
            variant === "destructive" ? "text-fg-error-secondary" : "text-fg-quaternary",
          )}
        />
      ) : null}
      {children}
    </MenuItem>
  );
}

export function DropdownMenuSeparator({ className, ...props }: SeparatorProps) {
  return <Separator {...props} className={cx("my-1 h-px w-full bg-border-secondary", className)} />;
}

export function DropdownMenuShortcut({ children }: { children: ReactNode }) {
  return <span className="ml-auto text-xs tracking-widest text-quaternary">{children}</span>;
}
