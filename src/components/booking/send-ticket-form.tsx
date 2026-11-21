"use client";

import { useActionState } from "react";
import { useT } from "@/components/i18n/provider";
import { buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { sendTicketTo, type SendTicketState } from "@/lib/booking/passenger-actions";

/** Sends the ticket (PDF attached) to any email the customer types. */
export function SendTicketForm({ bookingId }: { bookingId: string }) {
  const t = useT();
  const [state, action, pending] = useActionState<SendTicketState, FormData>(sendTicketTo, {
    status: "idle",
  });
  return (
    <form
      action={action}
      className="mt-8 rounded-2xl bg-secondary p-5 ring-1 ring-secondary ring-inset"
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label={t("Enviar el ticket a un email")}
            name="email"
            type="email"
            autoComplete="email"
            required
            error={state.status === "error" && state.message ? t(state.message) : undefined}
          />
        </div>
        <button type="submit" disabled={pending} className={buttonClasses({ size: "lg" })}>
          {pending ? t("Enviando…") : t("Enviar")}
        </button>
      </div>
      {state.status === "sent" && (
        <p role="status" className="mt-2 text-sm font-medium text-success-primary">
          {t("¡Enviado! Revisa tu bandeja de entrada.")}
        </p>
      )}
    </form>
  );
}
