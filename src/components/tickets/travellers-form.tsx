"use client";

import { useActionState } from "react";
import { useLocale, useT } from "@/components/i18n/provider";
import { FormAlert } from "@/components/forms/form-bits";
import { FormCard } from "@/components/booking/checkout-ui";
import { buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { saveTravellers, type TravellersState } from "@/lib/tickets/actions";

export type FormTrip = {
  bookingId: string;
  title: string;
  when: string;
  travellers: number;
  rows: { position: number; name: string; documentId: string | null; phone: string | null }[];
};

/** One block per excursion, one card per traveller: name, ID document, phone. */
export function TravellersForm({
  bookingId,
  trips,
  customerName,
}: {
  bookingId: string;
  trips: FormTrip[];
  customerName: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [state, action, pending] = useActionState<TravellersState, FormData>(saveTravellers, {
    status: "idle",
  });
  const errors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : {};

  return (
    <form action={action} noValidate className="mt-6 space-y-6">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="locale" value={locale} />
      {state.status === "error" && <FormAlert message={t(state.message)} />}
      {trips.map((trip, tripIndex) => (
        <FormCard key={trip.bookingId} title={trip.title}>
          <p className="-mt-3 text-sm text-tertiary first-letter:uppercase">{trip.when}</p>
          {Array.from({ length: trip.travellers }, (_, i) => {
            const n = i + 1;
            const key = `t_${trip.bookingId}_${n}`;
            const row = trip.rows.find((r) => r.position === n);
            const fallbackName = tripIndex === 0 && n === 1 ? customerName : "";
            const err = (f: string) =>
              errors[`${key}_${f}`] ? t(errors[`${key}_${f}`]) : undefined;
            return (
              <fieldset key={key} className="rounded-xl border border-secondary p-4">
                <legend className="px-1 text-sm font-semibold text-primary">
                  {t("Viajero {n}", { n })}
                </legend>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label={t("Nombre y apellidos")}
                    name={`${key}_name`}
                    autoComplete={n === 1 ? "name" : "off"}
                    required
                    defaultValue={values[`${key}_name`] ?? row?.name ?? fallbackName}
                    error={err("name")}
                  />
                  <Input
                    label={t("DNI, NIE o pasaporte")}
                    name={`${key}_doc`}
                    autoComplete="off"
                    required
                    defaultValue={values[`${key}_doc`] ?? row?.documentId ?? ""}
                    error={err("doc")}
                  />
                  <Input
                    label={t("Teléfono (opcional)")}
                    name={`${key}_phone`}
                    type="tel"
                    autoComplete={n === 1 ? "tel" : "off"}
                    defaultValue={values[`${key}_phone`] ?? row?.phone ?? ""}
                    error={err("phone")}
                  />
                </div>
              </fieldset>
            );
          })}
        </FormCard>
      ))}
      <p className="text-sm text-tertiary">
        {t(
          "Usamos estos datos solo para la lista de pasajeros del autobús. Al guardar te enviamos los billetes por email.",
        )}
      </p>
      <button
        type="submit"
        disabled={pending}
        className={buttonClasses({ size: "lg" }, "w-full md:w-auto")}
      >
        {pending ? t("Guardando…") : t("Guardar y recibir mis billetes")}
      </button>
    </form>
  );
}
