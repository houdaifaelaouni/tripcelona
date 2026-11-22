import { ArrowLeftRight, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { StatusBadge } from "@/components/admin/ui";

/**
 * One platform, laid out like an app-install approval screen (after the
 * shadcn.io "Approval screen" integration block): Tripcelona ⇄ platform,
 * the main ID, what the site will send, then the optional settings.
 */
export function ConnectCard({
  mark,
  name,
  active,
  id,
  events,
  help,
  children,
}: {
  mark: string;
  name: string;
  active: boolean;
  id: ReactNode;
  events: [string, string][];
  help: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={name}
      className="flex flex-col overflow-hidden rounded-2xl bg-primary shadow-xs ring-1 ring-secondary"
    >
      <div className="flex flex-col items-center gap-3 border-b border-secondary px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary ring-1 ring-secondary ring-inset">
            <Logo className="h-auto w-9" />
          </span>
          <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-fg-quaternary ring-1 ring-secondary ring-inset">
            <ArrowLeftRight aria-hidden className="size-3" />
          </span>
          <span
            aria-hidden
            className="flex size-12 items-center justify-center rounded-xl bg-brand-solid text-sm font-semibold text-white"
          >
            {mark}
          </span>
        </div>
        <div className="text-center">
          <h3 className="text-md font-semibold text-primary">{name}</h3>
          <div className="mt-1.5 flex justify-center">
            {active ? (
              <StatusBadge tone="success">Conectado</StatusBadge>
            ) : (
              <StatusBadge tone="neutral">Sin configurar</StatusBadge>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 border-b border-secondary px-5 py-5">
        {id}
        <p className="text-xs text-tertiary">{help}</p>
      </div>
      <div className="border-b border-secondary px-5 py-5">
        <p className="text-sm font-medium text-primary">La web enviará</p>
        <ul className="mt-2 divide-y divide-secondary border-y border-secondary">
          {events.map(([code, what]) => (
            <li key={code} className="flex gap-3 py-2.5">
              <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
              <div className="min-w-0">
                <code className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-xs text-primary ring-1 ring-secondary ring-inset">
                  {code}
                </code>
                <p className="mt-1 text-sm text-tertiary">{what}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        <p className="text-sm font-medium text-primary">Tus opciones</p>
        {children}
      </div>
    </section>
  );
}
