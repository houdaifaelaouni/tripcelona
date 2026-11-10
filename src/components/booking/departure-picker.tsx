"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { MAX_TRAVELLERS } from "@/lib/booking/schema";
import { formatDateLong, formatPrice, formatTime } from "@/lib/tours/format";
import type { Departure } from "@/lib/tours/types";

/**
 * Departure picker (FR-23/FR-24). A GET form to /reservar, so the choice is
 * carried in the URL and it works without JavaScript; JS only adds the live
 * total. Prices shown here are informative: checkout recomputes them.
 */
export function DeparturePicker({ departures }: { departures: Departure[] }) {
  const firstOpen = departures.find((d) => d.status === "open" && d.seatsLeft > 0);
  const [selected, setSelected] = useState(firstOpen?.id ?? "");
  const [travellers, setTravellers] = useState(1);
  const current = departures.find((d) => d.id === selected);
  const maxForSelected = Math.min(current?.seatsLeft ?? MAX_TRAVELLERS, MAX_TRAVELLERS);

  if (!firstOpen) return null;

  return (
    <form action="/reservar" method="get" className="mt-2">
      <fieldset>
        <legend className="text-base font-bold">Elige fecha</legend>
        <ul className="mt-2 space-y-2">
          {departures.map((d) => {
            const soldOut = d.status !== "open" || d.seatsLeft === 0;
            return (
              <li key={d.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-control border p-3 has-[:checked]:border-blue has-[:checked]:bg-blue/5 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-yellow",
                    soldOut
                      ? "cursor-not-allowed border-border bg-surface-alt text-muted"
                      : "border-border-strong hover:border-blue",
                  )}
                >
                  <input
                    type="radio"
                    name="salida"
                    value={d.id}
                    disabled={soldOut}
                    checked={selected === d.id}
                    onChange={() => setSelected(d.id)}
                    className="h-4 w-4 accent-blue"
                  />
                  <span className="flex-1">
                    <span className="block font-bold first-letter:uppercase">
                      {formatDateLong(d.startsAt)}
                    </span>
                    <span className="text-sm text-muted">
                      Salida {formatTime(d.startsAt)} · {formatPrice(d.priceCents)}
                    </span>
                  </span>
                  {soldOut ? (
                    <span className="rounded-control bg-danger px-2 py-0.5 text-sm font-bold text-white">
                      Completo
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "text-sm whitespace-nowrap",
                        d.seatsLeft <= 10 ? "font-bold text-danger" : "text-muted",
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

      <label className="mt-4 flex items-center justify-between gap-3">
        <span className="font-bold">Viajeros</span>
        <input
          type="number"
          name="personas"
          min={1}
          max={maxForSelected}
          value={travellers}
          onChange={(e) =>
            setTravellers(Math.max(1, Math.min(maxForSelected, Number(e.target.value) || 1)))
          }
          className="h-10 w-20 rounded-control border border-border-strong px-3 text-center"
        />
      </label>

      {current && (
        <p className="mt-3 flex items-baseline justify-between" aria-live="polite">
          <span className="text-muted">Total</span>
          <span className="text-2xl font-bold">{formatPrice(current.priceCents * travellers)}</span>
        </p>
      )}

      <button type="submit" className={buttonClasses({ size: "lg" }, "mt-3 w-full")}>
        Reservar
      </button>
    </form>
  );
}
