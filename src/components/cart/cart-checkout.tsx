"use client";

import { useLocale, useT } from "@/components/i18n/provider";
import Link from "@/components/i18n/link";
import { useActionState } from "react";
import { FormAlert } from "@/components/forms/form-bits";
import { Checkbox, Input, Textarea } from "@/components/ui/field";
import { buttonClasses } from "@/components/ui/button";
import { startCartCheckout } from "@/lib/booking/actions";
import type { CartCheckoutState } from "@/lib/booking/schema";
import { useCart } from "@/lib/cart/store";
import { formatDateLong, formatPrice } from "@/lib/tours/format";
import { cartTotal, useCartLines } from "./use-cart-lines";
import { FormCard, PaymentMethodCard } from "@/components/booking/checkout-ui";
import type { PaymentProvider } from "@/lib/payments/config";

export function CartCheckout({ provider }: { provider: PaymentProvider | null }) {
  const items = useCart();
  const { lines, loading, empty } = useCartLines();
  const locale = useLocale();
  const t = useT();
  const [state, action, pending] = useActionState<CartCheckoutState, FormData>(startCartCheckout, {
    status: "idle",
  });
  const errors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : {};

  if (empty) {
    return (
      <div className="max-w-xl">
        <p className="text-tertiary">{t("Tu carrito está vacío.")}</p>
        <Link href="/ofertas-de-viajes" className={buttonClasses({}, "mt-4")}>
          {t("Ver excursiones")}
        </Link>
      </div>
    );
  }

  const blocked = lines.some((l) => l.problem);
  const total = cartTotal(lines);

  return (
    <form
      action={action}
      noValidate
      className="mt-2 grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_400px]"
    >
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="locale" value={locale} />
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          {t("Empresa")}
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="space-y-6">
        {state.status === "error" && <FormAlert message={state.message} />}
        <FormCard title="Detalles de facturación">
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
            hint={t("Te enviaremos aquí la confirmación de cada excursión.")}
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
          <h2 className="text-xl font-semibold tracking-tight text-primary">
            {t("Tu pedido")} ({items.length}{" "}
            {items.length === 1 ? t("excursión") : t("excursiones")})
          </h2>
          <ul className="mt-4 divide-y divide-secondary border-t border-secondary">
            {lines.map((l) => (
              <li key={l.departureId} className="py-3">
                <p className="font-semibold text-primary">{l.title}</p>
                {l.startsAt && (
                  <p className="text-sm text-tertiary first-letter:uppercase">
                    {formatDateLong(l.startsAt, locale)}
                  </p>
                )}
                <p className="text-sm text-tertiary">
                  {l.travellers} × {formatPrice(l.unitCents, locale)} ·{" "}
                  <strong className="text-primary">
                    {formatPrice(l.unitCents * l.travellers, locale)}
                  </strong>
                </p>
                {l.problem && <p className="text-sm text-error-primary">{t(l.problem)}</p>}
              </li>
            ))}
          </ul>
          <Link
            href="/carrito"
            className="mt-1 inline-block text-sm font-semibold text-brand-secondary underline underline-offset-2"
          >
            {t("Modificar carrito")}
          </Link>
          <p
            className="mt-4 flex items-baseline justify-between border-t border-dashed border-primary pt-4"
            aria-live="polite"
          >
            <span className="font-semibold text-primary">{t("Total")}</span>
            <span className="text-display-xs font-semibold text-primary">
              {loading ? "–" : formatPrice(total, locale)}
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
            disabled={pending || loading || blocked}
            className={buttonClasses({ size: "lg", shape: "pill" }, "mt-5 w-full")}
          >
            {pending ? t("Reservando plazas…") : t("Realizar el pedido")}
          </button>
          {blocked && (
            <p className="mt-3 text-center text-sm text-error-primary">
              {t("Alguna excursión ya no está disponible.")}{" "}
              <Link href="/carrito" className="font-semibold underline underline-offset-2">
                {t("Revisa el carrito")}
              </Link>
              .
            </p>
          )}
          <p className="mt-3 text-center text-sm text-tertiary">
            {t("Guardamos tus plazas 15 minutos mientras completas el pago.")}
          </p>
        </div>
      </aside>
    </form>
  );
}
