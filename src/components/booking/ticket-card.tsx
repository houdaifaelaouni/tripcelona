import { TicketMotion } from "@/components/home/ticket-motion";
import type { TicketLine } from "@/lib/booking/passengers";
import { shownPassengers } from "@/lib/tickets/display";
import type { Locale } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";
import { site } from "@/lib/site";
import { formatDateLong, formatTime } from "@/lib/tours/format";

/* Same notched ticket as the home "next departure" card, notch at the perforation. */
const mask = (at: string) =>
  [
    `radial-gradient(circle 12px at 0 ${at}, #0000 98%, #000) left / 51% 100% no-repeat`,
    `radial-gradient(circle 12px at 100% ${at}, #0000 98%, #000) right / 51% 100% no-repeat`,
  ].join(", ");

/** The web e-ticket, one per trip; the PDF draws the same layout. */
export function TicketCard({
  line,
  locale,
  index,
  count,
  customerName,
}: {
  customerName: string;
  line: TicketLine;
  locale: Locale;
  index: number;
  count: number;
}) {
  const t = createT(locale);
  const notch = mask("10.5rem");
  return (
    <TicketMotion className="mx-auto w-full max-w-xl">
      <article
        className="overflow-hidden rounded-2xl bg-primary text-primary shadow-lg ring-1 ring-secondary ring-inset"
        style={{ mask: notch, WebkitMask: notch }}
        aria-label={t("Ticket {ref}", { ref: line.reference })}
      >
        <header className="flex h-[10.5rem] flex-col justify-between bg-blue px-6 pt-5 pb-6 text-white">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-yellow px-2.5 py-1 text-xs font-bold tracking-wide text-ink">
              E-TICKET
            </span>
            {count > 1 && (
              <span className="text-sm text-white/80">
                {index + 1} / {count}
              </span>
            )}
          </div>
          <div>
            <h2 className="line-clamp-2 text-xl leading-tight font-semibold md:text-2xl">
              {line.title}
            </h2>
            <p className="mt-1 text-sm text-white/85 first-letter:uppercase">
              {formatDateLong(line.startsAt, locale)} · {formatTime(line.startsAt, locale)}
            </p>
          </div>
        </header>
        <div aria-hidden className="px-6">
          <span data-ticket-perf className="block border-t-2 border-dashed border-secondary" />
        </div>
        <div data-ticket-stub className="grid gap-5 px-6 pt-5 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">
                {t("Referencia")}
              </p>
              <p className="text-2xl font-semibold text-brand-secondary">{line.reference}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">
                {t("Viajeros")}
              </p>
              <p className="text-2xl font-semibold">{line.travellers}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">
              {t("Punto de encuentro")}
            </p>
            <p className="mt-0.5">{line.meetingPoint ?? site.meetingPoint}</p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">
              {t("Pasajeros")}
            </p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              {shownPassengers(line, customerName).map((p, i) => (
                <li key={i}>
                  <span className="font-medium">{p.name}</span>
                  {p.documentId && <span className="text-sm text-tertiary"> · {p.documentId}</span>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </article>
    </TicketMotion>
  );
}
