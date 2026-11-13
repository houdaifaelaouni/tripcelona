"use client";

import { Check, Lock } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { PAYMENT_METHODS } from "@/lib/brand-assets";
import { cn } from "@/lib/cn";
import { useT } from "@/components/i18n/provider";
import type { PaymentProvider } from "@/lib/payments/config";

const STEPS = ["Carrito", "Datos y pago", "Confirmación"];

/** Title band with the three-step progress, as in the reference checkout. */
export function CheckoutBand({ current = 2 }: { current?: 1 | 2 | 3 }) {
  const t = useT();
  return (
    <header className="border-b border-secondary bg-secondary">
      <div className="container-detail flex flex-col gap-5 py-8 md:flex-row md:items-center md:justify-between md:py-10">
        <h1 className="text-3xl leading-[1.1] font-semibold tracking-[-0.035em] text-primary md:text-[2.5rem]">
          {t("Finalizar compra")}
        </h1>
        <ol aria-label={t("Progreso de la compra")} className="flex items-center gap-3 text-sm">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = n < current;
            const active = n === current;
            return (
              <li
                key={label}
                aria-current={active ? "step" : undefined}
                className="flex items-center gap-3"
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-inset",
                    done && "bg-brand-solid text-white ring-transparent",
                    active && "bg-primary-solid text-white ring-transparent",
                    !done && !active && "bg-primary text-tertiary ring-primary",
                  )}
                >
                  {done ? <Check aria-hidden className="size-4" /> : n}
                </span>
                <span
                  className={cn(
                    "hidden sm:inline",
                    active ? "font-semibold text-primary" : "text-tertiary",
                  )}
                >
                  {t(label)}
                </span>
                {n < STEPS.length && (
                  <span
                    aria-hidden
                    className="hidden w-8 border-t border-dashed border-brand-300 sm:block"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </header>
  );
}

export function FormCard({ title, children }: { title: string; children: ReactNode }) {
  const t = useT();
  return (
    <section className="rounded-3xl bg-primary p-6 shadow-xs ring-1 ring-secondary ring-inset md:p-8">
      <h2 className="mb-5 text-xl font-semibold tracking-tight text-primary">{t(title)}</h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

const GATEWAY: Record<PaymentProvider, string> = {
  stripe: "Pago seguro con Stripe",
  redsys: "Pago seguro con Redsys",
  paycomet: "Pago seguro con PAYCOMET",
};

/**
 * The payment method card. The site takes card payments through one gateway
 * at a time (PAYMENT_PROVIDER), so this shows that single option as selected.
 */
export function PaymentMethodCard({ provider }: { provider: PaymentProvider | null }) {
  const t = useT();
  return (
    <fieldset className="mt-6">
      <legend className="mb-3 text-sm font-semibold text-primary">{t("Método de pago")}</legend>
      <div className="rounded-2xl bg-primary p-4 ring-2 ring-brand">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full ring-1 ring-brand ring-inset"
          >
            <span className="size-2 rounded-full bg-brand-solid" />
          </span>
          <div>
            <p className="font-semibold text-primary">{t("Tarjeta de crédito o débito")}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-tertiary">
              <Lock aria-hidden className="size-3.5" />
              {provider ? t(GATEWAY[provider]) : t("Pago con tarjeta no disponible ahora mismo")}
            </p>
          </div>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={t("Tarjetas aceptadas")}>
          {PAYMENT_METHODS.map((m) => (
            <li key={m.name}>
              <Image
                src={m.src}
                alt={m.name}
                width={72}
                height={45}
                className="h-6 w-auto rounded ring-1 ring-secondary ring-inset"
              />
            </li>
          ))}
        </ul>
      </div>
    </fieldset>
  );
}
