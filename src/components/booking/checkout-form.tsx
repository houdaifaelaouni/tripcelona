"use client";

import { useLocale, useT } from "@/components/i18n/provider";
import Link from "@/components/i18n/link";
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
  const locale = useLocale();
  const t = useT();
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
      <input type="hidden" name="locale" value={locale} />
      {/* Honeypot (FR-41): hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          {t("Empresa")}
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="space-y-6">
        {state.status === "error" && <FormAlert message={state.message} />}

        <FormCard title="Detalles de facturación">
          <div className="rounded-xl border border-secondary p-4">
            <QuantityStepper
              label={t("Viajeros")}
              hint={t("Quedan {n} plazas en esta salida.", { n: seatsLeft })}
              name="travellers"
              min={1}
              max={max}
              value={travellers}
              onChange={setTravellers}
            />
            {errors.travellers && (
              <p className="mt-2 text-sm text-error-primary" role="alert">
                {t(errors.travellers)}
              </p>
            )}
          </div>
          <Input
            label={t("Nombre y apellidos")}
            name="name"
            autoComplete="name"
            required
            defaultValue={values.name}
            error={errors.name ? t(errors.name) : undefined}
          />
          <Input
            label={t("Teléfono")}
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            defaultValue={values.phone}
            error={errors.phone ? t(errors.phone) : undefined}
          />
          <Input
            label={t("Dirección de correo electrónico")}
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={values.email}
            error={errors.email ? t(errors.email) : undefined}
            hint={t("Te enviaremos aquí la confirmación.")}
          />
        </FormCard>

        <FormCard title="Información adicional">
          <Textarea
            label={t("Notas del pedido (opcional)")}
            name="pickupNote"
            rows={3}
            maxLength={500}
            defaultValue={values.pickupNote}
            hint={t("Alergias, movilidad reducida o cualquier cosa que debamos saber.")}
          />
        </FormCard>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-3xl bg-secondary p-6 ring-1 ring-secondary ring-inset md:p-7">
          <h2 className="text-xl font-semibold tracking-tight text-primary">{t("Tu pedido")}</h2>
          {summary}
          <p
            className="mt-4 flex items-baseline justify-between border-t border-dashed border-primary pt-4"
            aria-live="polite"
          >
            <span className="font-semibold text-primary">
              {t("Total")} ({travellers > 0 ? travellers : "–"} × {formatPrice(unitCents, locale)})
            </span>
            <span className="text-display-xs font-semibold text-primary">
              {travellers > 0 && travellers <= max
                ? formatPrice(unitCents * travellers, locale)
                : "–"}
            </span>
          </p>

          <PaymentMethodCard provider={provider} />

          <div className="mt-5">
            <Checkbox
              name="terms"
              required
              error={errors.terms ? t(errors.terms) : undefined}
              label={
                <>
                  {t("He leído y acepto las")}{" "}
                  <Link
                    href="/condiciones-de-contratacion"
                    target="_blank"
                    className="font-semibold underline underline-offset-2"
                  >
                    {t("condiciones de contratación")}
                  </Link>{" "}
                  {t("y la")}{" "}
                  <Link
                    href="/politica-de-privacidad"
                    target="_blank"
                    className="font-semibold underline underline-offset-2"
                  >
                    {t("política de privacidad")}
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
            {pending ? t("Reservando plazas…") : t("Realizar el pedido")}
          </button>
          <p className="mt-3 text-center text-sm text-tertiary">
            {t("Guardamos tus plazas 15 minutos mientras completas el pago.")}
          </p>
        </div>
      </aside>
    </form>
  );
}
