"use client";

import { useActionState } from "react";
import { useLocale, useT } from "@/components/i18n/provider";
import { FormAlert } from "@/components/forms/form-bits";
import { buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { savePassengers, type PassengerFormState } from "@/lib/booking/passenger-actions";

export type PassengerFormLine = {
  bookingId: string;
  title: string;
  when: string;
  travellers: number;
  passengers: { name: string; documentId: string | null }[];
};

/**
 * After payment: one name (and optional ID document) per traveller. Saving
 * emails the ticket and opens it; the same form edits it later.
 */
export function PassengerForm({
  bookingId,
  customerName,
  lines,
  editing = false,
}: {
  bookingId: string;
  customerName: string;
  lines: PassengerFormLine[];
  editing?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const [state, action, pending] = useActionState<PassengerFormState, FormData>(savePassengers, {
    status: "idle",
  });
  const values = state.values ?? {};
  const errors = state.errors ?? {};

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="locale" value={locale} />
      {state.status === "error" && state.message && <FormAlert message={state.message} />}
      {lines.map((line, lineIndex) => (
        <fieldset
          key={line.bookingId}
          className="rounded-2xl bg-primary p-5 ring-1 ring-secondary ring-inset md:p-6"
        >
          <legend className="sr-only">{line.title}</legend>
          <p className="font-semibold text-primary">{line.title}</p>
          <p className="text-sm text-tertiary first-letter:uppercase">{line.when}</p>
          <ol className="mt-4 space-y-4">
            {Array.from({ length: line.travellers }, (_, i) => {
              const nameKey = `name:${line.bookingId}:${i}`;
              const docKey = `doc:${line.bookingId}:${i}`;
              const saved = line.passengers[i];
              const fallback = lineIndex === 0 && i === 0 ? customerName : "";
              return (
                <li
                  key={nameKey}
                  className="grid gap-3 border-t border-secondary pt-4 first:border-0 first:pt-0 sm:grid-cols-[1fr_12rem]"
                >
                  <Input
                    label={t("Viajero {n}: nombre y apellidos", { n: i + 1 })}
                    name={nameKey}
                    autoComplete={i === 0 ? "name" : "off"}
                    required
                    defaultValue={values[nameKey] ?? saved?.name ?? fallback}
                    error={errors[nameKey] ? t(errors[nameKey]) : undefined}
                  />
                  <Input
                    label={t("DNI o pasaporte (opcional)")}
                    name={docKey}
                    autoComplete="off"
                    defaultValue={values[docKey] ?? saved?.documentId ?? ""}
                  />
                </li>
              );
            })}
          </ol>
        </fieldset>
      ))}
      <button
        type="submit"
        disabled={pending}
        className={buttonClasses({ size: "lg" }, "w-full sm:w-auto")}
      >
        {pending
          ? t("Generando tu ticket…")
          : editing
            ? t("Guardar y reenviar el ticket")
            : t("Obtener mi ticket")}
      </button>
    </form>
  );
}
