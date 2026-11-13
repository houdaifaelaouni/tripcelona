"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { Checkbox, Input, Textarea } from "@/components/ui/field";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { FormAlert } from "@/components/forms/form-bits";
import { buttonClasses } from "@/components/ui/button";
import { startCheckout } from "@/lib/booking/actions";
import { MAX_TRAVELLERS, type CheckoutState } from "@/lib/booking/schema";
import { formatPrice } from "@/lib/tours/format";
import type { PaymentProvider } from "@/lib/payments/config";
import { FormCard, PaymentMethodCard } from "./checkout-ui";

export function CheckoutForm({
  departureId,
  unitCents,
  seatsLeft,
  initialTravellers,
  summary,
  provider,
}: {
  departureId: string;
  unitCents: number;
  seatsLeft: number;
  initialTravellers: number;
  summary: ReactNode;
  provider: PaymentProvider | null;
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
    <form
      action={action}
      noValidate
      className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_400px]"
    >
      <input type="hidden" name="departureId" value={departureId} />
      {/* Honeypot (FR-41): hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Empresa
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="space-y-6">
        {state.status === "error" && <FormAlert message={state.message} />}

        <FormCard title="Detalles de facturación">
          <div className="rounded-xl border border-secondary p-4">
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
              <p className="mt-2 text-sm text-error-primary" role="alert">
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
            label="Teléfono"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            defaultValue={values.phone}
            error={errors.phone}
          />
          <Input
            label="Dirección de correo electrónico"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={values.email}
            error={errors.email}
            hint="Te enviaremos aquí la confirmación."
          />
        </FormCard>

        <FormCard title="Información adicional">
          <Textarea
            label="Notas del pedido (opcional)"
            name="pickupNote"
            rows={3}
            maxLength={500}
            defaultValue={values.pickupNote}
            hint="Alergias, movilidad reducida o cualquier cosa que debamos saber."
          />
        </FormCard>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-3xl bg-secondary p-6 ring-1 ring-secondary ring-inset md:p-7">
          <h2 className="text-xl font-semibold tracking-tight text-primary">Tu pedido</h2>
          {summary}
          <p
            className="mt-4 flex items-baseline justify-between border-t border-dashed border-primary pt-4"
            aria-live="polite"
          >
            <span className="font-semibold text-primary">
              Total ({travellers > 0 ? travellers : "–"} × {formatPrice(unitCents)})
            </span>
            <span className="text-display-xs font-semibold text-primary">
              {travellers > 0 && travellers <= max ? formatPrice(unitCents * travellers) : "–"}
            </span>
          </p>

          <PaymentMethodCard provider={provider} />

          <div className="mt-5">
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
          </div>

          <button
            type="submit"
            disabled={pending}
            className={buttonClasses({ size: "lg", shape: "pill" }, "mt-5 w-full")}
          >
            {pending ? "Reservando plazas…" : "Realizar el pedido"}
          </button>
          <p className="mt-3 text-center text-sm text-tertiary">
            Guardamos tus plazas 15 minutos mientras completas el pago.
          </p>
        </div>
      </aside>
    </form>
  );
}
