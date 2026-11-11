/**
 * Settings page parts, recreated after the Untitled UI settings page
 * pattern: link tabs with an underline, a section header with actions, and
 * label-left / fields-right rows split by dividers.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin/cuenta", label: "Mi cuenta" },
  { href: "/admin/equipo", label: "Equipo", ownerOnly: true },
  { href: "/admin/ajustes", label: "Empresa", ownerOnly: true },
];

export function SettingsTabs({ current, role }: { current: string; role: "owner" | "editor" }) {
  return (
    <nav aria-label="Ajustes" className="-mt-4 mb-8 overflow-x-auto border-b border-secondary">
      <ul className="flex gap-3">
        {TABS.filter((t) => role === "owner" || !t.ownerOnly).map((t) => {
          const active = t.href === current;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex h-8 items-center border-b-2 px-1 pb-3 text-sm font-semibold whitespace-nowrap",
                  active
                    ? "border-fg-brand-primary_alt text-brand-secondary"
                    : "border-transparent text-quaternary hover:border-fg-brand-primary_alt hover:text-brand-secondary",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** One settings row: label and help on the left, the fields on the right. */
export function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-4 border-b border-secondary py-5 lg:grid-cols-[minmax(200px,280px)_minmax(0,512px)] lg:gap-8">
      <div>
        <p className="text-sm font-semibold text-secondary">{label}</p>
        {description && <p className="mt-0.5 text-sm text-tertiary">{description}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
