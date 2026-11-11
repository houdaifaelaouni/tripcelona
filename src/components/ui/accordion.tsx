import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Accordion built on <details>/<summary>: keyboard and screen-reader support
 * come from the platform and it works without JavaScript. Hairline rows
 * (Opensource UI accordion, MIT; see THIRD_PARTY_NOTICES.md).
 */
export function Accordion({
  items,
}: {
  items: { id: string; title: string; content: ReactNode }[];
}) {
  return (
    <div className="divide-y divide-secondary border-y border-secondary">
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
            {item.title}
            <ChevronDown
              aria-hidden
              size={20}
              className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>
          <div className="pb-5 text-tertiary">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
