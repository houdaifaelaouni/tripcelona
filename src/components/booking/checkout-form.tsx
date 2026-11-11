"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Checkbox, Input, Textarea } from "@/components/ui/field";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { FormAlert } from "@/components/forms/form-bits";
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
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="departureId" value={departureId} />
      {/* Honeypot (FR-41): hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Empresa
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.status === "error" && <FormAlert message={state.message} />}

      <div className="rounded-card border border-border p-4">
        <QuantityStepper
          label="Viajeros"
          hint={`Quedan ${seatsLeft} plazas en esta salida.`}
          name="travellers"
          min={1}
          max={max}
          value={travellers}
          onChange={setTravellers}
        />
        {errors.travellers && (
          <p className="mt-2 text-meta text-danger" role="alert">
            {errors.travellers}
          </p>
        )}
      </div>
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
        className="flex items-baseline justify-between border-t border-border pt-4"
        aria-live="polite"
      >
        <span className="text-muted">
          Total ({travellers > 0 ? travellers : "–"} × {formatPrice(unitCents)})
        </span>
        <span className="text-display-sm font-semibold">
          {travellers > 0 && travellers <= max ? formatPrice(unitCents * travellers) : "–"}
        </span>
      </p>

      <button type="submit" disabled={pending} className={buttonClasses({ size: "lg" }, "w-full")}>
        {pending ? "Reservando plazas…" : "Continuar al pago"}
      </button>
      <p className="text-center text-meta text-muted">
        Guardamos tus plazas 15 minutos mientras completas el pago.
      </p>
    </form>
  );
}
