"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { buttonClasses } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { cn } from "@/lib/cn";
import { useLocale, useT } from "@/components/i18n/provider";
import { localizePath } from "@/lib/i18n/config";
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
  const t = useT();
  const locale = useLocale();
  const firstOpen = departures.find((d) => d.status === "open" && d.seatsLeft > 0);
  const [selected, setSelected] = useState(firstOpen?.id ?? "");
  const [travellers, setTravellers] = useState(1);
  const current = departures.find((d) => d.id === selected);
  const maxForSelected = Math.min(current?.seatsLeft ?? MAX_TRAVELLERS, MAX_TRAVELLERS);

  if (!firstOpen) return null;

  const choose = (d: Departure) => {
    setSelected(d.id);
    setTravellers((n) => Math.min(n, Math.min(d.seatsLeft, MAX_TRAVELLERS)));
  };

  return (
    <form action={localizePath("/reservar", locale)} method="get" className="mt-4">
      <fieldset>
        <legend className="text-md font-semibold text-primary">{t("Elige fecha")}</legend>
        <ul className="mt-3 space-y-2">
          {departures.map((d) => {
            const soldOut = d.status !== "open" || d.seatsLeft === 0;
            const { day, month } = dateParts(d.startsAt, locale);
            return (
              <li key={d.id}>
                <label
                  className={cn(
                    "group flex items-center gap-3 rounded-xl bg-primary p-2 pr-3 ring-1 transition-shadow ring-inset has-[:checked]:bg-brand-primary_alt has-[:checked]:ring-2 has-[:checked]:ring-brand has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-yellow",
                    soldOut
                      ? "cursor-not-allowed ring-secondary text-quaternary"
                      : "cursor-pointer ring-secondary hover:ring-primary",
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
                      "flex size-12 shrink-0 flex-col items-center justify-center rounded-lg leading-none",
                      soldOut
                        ? "bg-secondary line-through"
                        : "bg-secondary text-primary group-has-[:checked]:bg-brand-solid group-has-[:checked]:text-white",
                    )}
                  >
                    <span className="text-base font-semibold">{day}</span>
                    <span className="text-badge uppercase">{month}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-primary first-letter:uppercase">
                      {formatDateLong(d.startsAt, locale)}
                    </span>
                    <span className="text-sm text-tertiary">
                      {t("Salida {time}", { time: formatTime(d.startsAt, locale) })} ·{" "}
                      {formatPrice(d.priceCents, locale)}
                    </span>
                  </span>
                  {soldOut ? (
                    <span className="rounded-full bg-utility-red-50 px-2 py-0.5 text-xs font-medium text-utility-red-700 ring-1 ring-utility-red-200 ring-inset">
                      {t("Completo")}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "text-caption whitespace-nowrap",
                        d.seatsLeft <= 10 ? "font-semibold text-red-700" : "text-tertiary",
                      )}
                    >
                      {d.seatsLeft <= 10
                        ? t("¡Quedan {n}!", { n: d.seatsLeft })
                        : t("{n} plazas", { n: d.seatsLeft })}
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <QuantityStepper
        label={t("Viajeros")}
        name="personas"
        min={1}
        max={maxForSelected}
        value={travellers}
        onChange={setTravellers}
        className="mt-5 border-t border-secondary pt-5"
      />

      {current && (
        <p className="mt-5 flex items-baseline justify-between" aria-live="polite">
          <span className="text-tertiary">{t("Total")}</span>
          <span className="text-display-sm font-semibold">
            {formatPrice(current.priceCents * travellers, locale)}
          </span>
        </p>
      )}

      <button type="submit" className={buttonClasses({ size: "lg" }, "mt-4 w-full")}>
        {t("Reservar")}
      </button>
      {current && <AddToCartButton departureId={current.id} travellers={travellers} />}
    </form>
  );
}
