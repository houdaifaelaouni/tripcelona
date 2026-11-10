"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { cn } from "@/lib/cn";
import { MAX_TRAVELLERS } from "@/lib/booking/schema";
import { dateParts, formatDateLong, formatPrice, formatTime } from "@/lib/tours/format";
import type { Departure } from "@/lib/tours/types";

/**
 * Departure picker (FR-23/FR-24). A GET form to /reservar, so the choice is
 * carried in the URL and it works without JavaScript; JS only adds the live
 * total. Prices shown here are informative: checkout recomputes them.
 *
 * Slot list with circular day cells and the Opensource UI quantity stepper
 * (MIT, see THIRD_PARTY_NOTICES.md).
 */
export function DeparturePicker({ departures }: { departures: Departure[] }) {
  const firstOpen = departures.find((d) => d.status === "open" && d.seatsLeft > 0);
  const [selected, setSelected] = useState(firstOpen?.id ?? "");
  const [travellers, setTravellers] = useState(1);
  const current = departures.find((d) => d.id === selected);
  const maxForSelected = Math.min(current?.seatsLeft ?? MAX_TRAVELLERS, MAX_TRAVELLERS);

  if (!firstOpen) return null;

  const choose = (d: Departure) => {
    setSelected(d.id);
    setTravellers((t) => Math.min(t, Math.min(d.seatsLeft, MAX_TRAVELLERS)));
  };

  return (
    <form action="/reservar" method="get" className="mt-4">
      <fieldset>
        <legend className="text-base font-semibold">Elige fecha</legend>
        <ul className="mt-3 space-y-2">
          {departures.map((d) => {
            const soldOut = d.status !== "open" || d.seatsLeft === 0;
            const { day, month } = dateParts(d.startsAt);
            return (
              <li key={d.id}>
                <label
                  className={cn(
                    "group flex items-center gap-3 rounded-card border p-2 pr-3 transition-colors has-[:checked]:border-ink has-[:checked]:shadow-[inset_0_0_0_1px_var(--color-ink)] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-yellow",
                    soldOut
                      ? "cursor-not-allowed border-border text-muted"
                      : "cursor-pointer border-border hover:border-ink",
                  )}
                >
                  <input
                    type="radio"
                    name="salida"
                    value={d.id}
                    disabled={soldOut}
                    checked={selected === d.id}
                    onChange={() => choose(d)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-12 shrink-0 flex-col items-center justify-center rounded-full leading-none",
                      soldOut
                        ? "bg-surface-alt line-through"
                        : "bg-surface-alt text-ink group-has-[:checked]:bg-ink group-has-[:checked]:text-white",
                    )}
                  >
                    <span className="text-base font-semibold">{day}</span>
                    <span className="text-badge uppercase">{month}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-meta font-semibold first-letter:uppercase">
                      {formatDateLong(d.startsAt)}
                    </span>
                    <span className="text-caption text-muted">
                      Salida {formatTime(d.startsAt)} · {formatPrice(d.priceCents)}
                    </span>
                  </span>
                  {soldOut ? (
                    <span className="rounded-full bg-danger px-2 py-0.5 text-badge font-semibold text-white">
                      Completo
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "text-caption whitespace-nowrap",
                        d.seatsLeft <= 10 ? "font-semibold text-danger" : "text-muted",
                      )}
                    >
                      {d.seatsLeft <= 10 ? `¡Quedan ${d.seatsLeft}!` : `${d.seatsLeft} plazas`}
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <QuantityStepper
        label="Viajeros"
        name="personas"
        min={1}
        max={maxForSelected}
        value={travellers}
        onChange={setTravellers}
        className="mt-5 border-t border-border pt-5"
      />

      {current && (
        <p className="mt-5 flex items-baseline justify-between" aria-live="polite">
          <span className="text-muted">Total</span>
          <span className="text-display-sm font-semibold">
            {formatPrice(current.priceCents * travellers)}
          </span>
        </p>
      )}

      <button type="submit" className={buttonClasses({ size: "lg" }, "mt-4 w-full")}>
        Reservar
      </button>
    </form>
  );
}
