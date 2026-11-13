"use client";

import { Trash2 } from "lucide-react";
import Link from "@/components/i18n/link";
import { buttonClasses } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { removeFromCart, setCartQuantity } from "@/lib/cart/store";
import { MAX_TRAVELLERS } from "@/lib/booking/schema";
import { formatDateLong, formatPrice, formatTime } from "@/lib/tours/format";
import { cartTotal, useCartLines } from "./use-cart-lines";

export function CartView() {
  const { lines, loading, empty } = useCartLines();

  if (empty) {
    return (
      <div className="max-w-xl">
        <p className="text-tertiary">Tu carrito está vacío. Elige una excursión y una fecha.</p>
        <Link href="/ofertas-de-viajes" className={buttonClasses({}, "mt-4")}>
          Ver excursiones
        </Link>
      </div>
    );
  }

  const total = cartTotal(lines);
  const blocked = lines.some((l) => l.problem);

  return (
    <div className="grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <ul className="space-y-4" aria-busy={loading}>
        {lines.map((l) => (
          <li
            key={l.departureId}
            className="rounded-xl border border-secondary bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {l.area && <p className="text-sm text-tertiary">{l.area}</p>}
                <h2 className="text-base font-semibold">{l.title}</h2>
                {l.startsAt && (
                  <p className="text-sm text-tertiary">
                    <span className="first-letter:uppercase">{formatDateLong(l.startsAt)}</span> ·
                    salida {formatTime(l.startsAt)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeFromCart(l.departureId)}
                aria-label={`Quitar ${l.title} del carrito`}
                className="rounded-md p-2 text-tertiary hover:bg-secondary hover:text-primary"
              >
                <Trash2 size={18} aria-hidden />
              </button>
            </div>
            {l.problem ? (
              <p className="mt-3 text-sm text-error-primary" role="alert">
                {l.problem}
              </p>
            ) : null}
            {l.startsAt && l.seatsLeft > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <QuantityStepper
                  label="Viajeros"
                  min={1}
                  max={Math.min(l.seatsLeft, MAX_TRAVELLERS)}
                  value={Math.min(l.travellers, Math.min(l.seatsLeft, MAX_TRAVELLERS))}
                  onChange={(n) => setCartQuantity(l.departureId, n)}
                />
                <p className="text-base font-semibold">{formatPrice(l.unitCents * l.travellers)}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-xl border border-secondary bg-white p-6 shadow-lg">
          <p className="flex items-baseline justify-between" aria-live="polite">
            <span className="text-tertiary">Total</span>
            <span className="text-display-sm font-semibold">
              {loading ? "–" : formatPrice(total)}
            </span>
          </p>
          {blocked && (
            <p className="mt-2 text-sm text-error-primary">
              Quita o ajusta las excursiones marcadas para continuar.
            </p>
          )}
          {blocked || loading ? (
            <span
              aria-disabled
              className={buttonClasses(
                { size: "lg" },
                "mt-4 w-full opacity-50 pointer-events-none",
              )}
            >
              Continuar al pago
            </span>
          ) : (
            <Link
              href="/reservar?carrito=1"
              className={buttonClasses({ size: "lg" }, "mt-4 w-full")}
            >
              Continuar al pago
            </Link>
          )}
          <p className="mt-3 text-center text-sm text-tertiary">
            Un solo pago para todas las excursiones.
          </p>
          <Link
            href="/ofertas-de-viajes"
            className="mt-3 block text-center text-sm font-semibold underline underline-offset-2"
          >
            Seguir viendo excursiones
          </Link>
        </div>
      </aside>
    </div>
  );
}
