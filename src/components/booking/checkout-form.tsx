"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Input } from "@/components/ui/field";
import { buttonClasses } from "@/components/ui/button";
import { startCheckout } from "@/lib/booking/actions";
import { MAX_TRAVELLERS, type CheckoutState } from "@/lib/booking/schema";
import { formatPrice } from "@/lib/tours/format";

export function CheckoutForm({
  departureId,
  unitCents,
  seatsLeft,
  initialTravellers,
}: {
  departureId: string;
  unitCents: number;
  seatsLeft: number;
  initialTravellers: number;
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, {
    status: "idle",
  });
  const errors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : {};
  const max = Math.min(seatsLeft, MAX_TRAVELLERS);
  const [travellers, setTravellers] = useState(
    Number(values.travellers) || Math.min(Math.max(initialTravellers, 1), max),
  );

  return (
    <form action={action} noValidate className="space-y-4">
      <input type="hidden" name="departureId" value={departureId} />
      {/* Honeypot (FR-41): hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Empresa
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.status === "error" && (
        <div
          role="alert"
          className="rounded-control border border-danger bg-danger/5 p-3 font-bold text-danger"
        >
          {state.message}
        </div>
      )}

      <Input
        label="Viajeros"
        name="travellers"
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        required
        value={travellers}
        onChange={(e) => setTravellers(Number(e.target.value))}
        error={errors.travellers}
        hint={`Quedan ${seatsLeft} plazas en esta salida.`}
      />
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
        hint="Te enviaremos aquí la confirmación."
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
      <div className="flex flex-col gap-1">
        <label htmlFor="pickupNote" className="text-sm font-bold">
          Comentarios <span className="font-normal text-muted">(opcional)</span>
        </label>
        <textarea
          id="pickupNote"
          name="pickupNote"
          rows={3}
          maxLength={500}
          defaultValue={values.pickupNote}
          className="rounded-control border border-border-strong px-3 py-2 hover:border-blue"
          aria-describedby="pickupNote-hint"
        />
        <p id="pickupNote-hint" className="text-sm text-muted">
          Alergias, movilidad reducida o cualquier cosa que debamos saber.
        </p>
      </div>

      <div>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-1 h-4 w-4 accent-blue"
            aria-invalid={errors.terms ? true : undefined}
            aria-describedby={errors.terms ? "terms-error" : undefined}
          />
          <span>
            He leído y acepto las{" "}
            <Link
              href="/condiciones-de-contratacion"
              target="_blank"
              className="text-blue underline"
            >
              condiciones de contratación
            </Link>{" "}
            y la{" "}
            <Link href="/politica-de-privacidad" target="_blank" className="text-blue underline">
              política de privacidad
            </Link>
            .
          </span>
        </label>
        {errors.terms && (
          <p id="terms-error" className="mt-1 text-sm text-danger" role="alert">
            {errors.terms}
          </p>
        )}
      </div>

      <p
        className="flex items-baseline justify-between border-t border-border pt-4"
        aria-live="polite"
      >
        <span className="text-muted">
          Total ({travellers > 0 ? travellers : "–"} × {formatPrice(unitCents)})
        </span>
        <span className="text-2xl font-bold">
          {travellers > 0 && travellers <= max ? formatPrice(unitCents * travellers) : "–"}
        </span>
      </p>

      <button type="submit" disabled={pending} className={buttonClasses({ size: "lg" }, "w-full")}>
        {pending ? "Reservando plazas…" : "Continuar al pago"}
      </button>
      <p className="text-center text-sm text-muted">
        Guardamos tus plazas 15 minutos mientras completas el pago.
      </p>
    </form>
  );
}
