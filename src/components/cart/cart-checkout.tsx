"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormAlert } from "@/components/forms/form-bits";
import { Checkbox, Input, Textarea } from "@/components/ui/field";
import { buttonClasses } from "@/components/ui/button";
import { startCartCheckout } from "@/lib/booking/actions";
import type { CartCheckoutState } from "@/lib/booking/schema";
import { useCart } from "@/lib/cart/store";
import { formatDateLong, formatPrice } from "@/lib/tours/format";
import { cartTotal, useCartLines } from "./use-cart-lines";

export function CartCheckout() {
  const items = useCart();
  const { lines, loading, empty } = useCartLines();
  const [state, action, pending] = useActionState<CartCheckoutState, FormData>(startCartCheckout, {
    status: "idle",
  });
  const errors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : {};

  if (empty) {
    return (
      <div className="max-w-xl">
        <p className="text-tertiary">Tu carrito está vacío.</p>
        <Link href="/ofertas-de-viajes" className={buttonClasses({}, "mt-4")}>
          Ver excursiones
        </Link>
      </div>
    );
  }

  const blocked = lines.some((l) => l.problem);
  const total = cartTotal(lines);

  return (
    <div className="grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="order-last lg:order-none" aria-labelledby="datos-heading">
        <h2 id="datos-heading" className="mb-6 text-display-sm">
          Tus datos
        </h2>
        <form action={action} noValidate className="space-y-5">
          <input type="hidden" name="items" value={JSON.stringify(items)} />
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Empresa
              <input type="text" name="company" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          {state.status === "error" && <FormAlert message={state.message} />}
          <Input
            label="Nombre y apellidos"
            name="name"
            autoComplete="name"
            required
            defaultValue={values.name}
            error={errors.name}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={values.email}
            error={errors.email}
            hint="Te enviaremos aquí la confirmación de cada excursión."
          />
          <Input
            label="Teléfono (WhatsApp)"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            defaultValue={values.phone}
            error={errors.phone}
          />
          <Textarea
            label="Comentarios (opcional)"
            name="pickupNote"
            rows={3}
            maxLength={500}
            defaultValue={values.pickupNote}
            hint="Alergias, movilidad reducida o cualquier cosa que debamos saber."
          />
          <Checkbox
            name="terms"
            required
            error={errors.terms}
            label={
              <>
                He leído y acepto las{" "}
                <Link
                  href="/condiciones-de-contratacion"
                  target="_blank"
                  className="font-semibold underline underline-offset-2"
                >
                  condiciones de contratación
                </Link>{" "}
                y la{" "}
                <Link
                  href="/politica-de-privacidad"
                  target="_blank"
                  className="font-semibold underline underline-offset-2"
                >
                  política de privacidad
                </Link>
                .
              </>
            }
          />
          <p
            className="flex items-baseline justify-between border-t border-secondary pt-4"
            aria-live="polite"
          >
            <span className="text-tertiary">Total</span>
            <span className="text-display-sm font-semibold">
              {loading ? "–" : formatPrice(total)}
            </span>
          </p>
          <button
            type="submit"
            disabled={pending || loading || blocked}
            className={buttonClasses({ size: "lg" }, "w-full")}
          >
            {pending ? "Reservando plazas…" : "Continuar al pago"}
          </button>
          {blocked && (
            <p className="text-center text-sm text-error-primary">
              Alguna excursión ya no está disponible.{" "}
              <Link href="/carrito" className="font-semibold underline underline-offset-2">
                Revisa el carrito
              </Link>
              .
            </p>
          )}
          <p className="text-center text-sm text-tertiary">
            Guardamos tus plazas 15 minutos mientras completas el pago.
          </p>
        </form>
      </section>
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-xl border border-secondary bg-white p-6 shadow-lg">
          <h2 className="text-base font-semibold">
            Tu carrito ({items.length} {items.length === 1 ? "excursión" : "excursiones"})
          </h2>
          <ul className="mt-4 divide-y divide-secondary border-t border-secondary">
            {lines.map((l) => (
              <li key={l.departureId} className="py-3">
                <p className="font-semibold">{l.title}</p>
                {l.startsAt && (
                  <p className="text-sm text-tertiary first-letter:uppercase">
                    {formatDateLong(l.startsAt)}
                  </p>
                )}
                <p className="text-sm text-tertiary">
                  {l.travellers} × {formatPrice(l.unitCents)} ·{" "}
                  <strong className="text-primary">
                    {formatPrice(l.unitCents * l.travellers)}
                  </strong>
                </p>
                {l.problem && <p className="text-sm text-error-primary">{l.problem}</p>}
              </li>
            ))}
          </ul>
          <Link
            href="/carrito"
            className="mt-2 inline-block text-sm font-semibold underline underline-offset-2"
          >
            Modificar carrito
          </Link>
        </div>
      </aside>
    </div>
  );
}
