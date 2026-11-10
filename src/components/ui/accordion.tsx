import type { ReactNode } from "react";

/**
 * Accordion built on <details>/<summary>: keyboard and screen-reader support
 * come from the platform and it works without JavaScript.
 */
export function Accordion({
  items,
}: {
  items: { id: string; title: string; content: ReactNode }[];
}) {
  return (
    <div className="divide-y divide-border rounded-card border border-border">
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-bold marker:hidden hover:bg-surface-alt [&::-webkit-details-marker]:hidden">
            {item.title}
            <span aria-hidden className="text-blue transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="px-4 pb-4 text-muted">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
