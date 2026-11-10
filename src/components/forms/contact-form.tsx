"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { submitContact } from "@/lib/forms/actions";
import type { FormState } from "@/lib/forms/schema";
import { FormAlert, FormSuccess, Honeypot, PrivacyConsent } from "./form-bits";

export function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(submitContact, {
    status: "idle",
  });
  if (state.status === "ok") {
    return (
      <FormSuccess title="Mensaje enviado">
        <p>Gracias por escribirnos. Te responderemos lo antes posible.</p>
      </FormSuccess>
    );
  }
  const errors = state.status === "error" ? state.fieldErrors : {};
  const v = (k: string) => (state.status === "error" ? String(state.values[k] ?? "") : "");

  return (
    <form action={action} noValidate className="relative space-y-4">
      <Honeypot />
      {state.status === "error" && <FormAlert message={state.message} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          name="name"
          autoComplete="name"
          required
          defaultValue={v("name")}
          error={errors.name}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={v("email")}
          error={errors.email}
        />
      </div>
      <Input
        label="Teléfono (opcional)"
        name="phone"
        type="tel"
        autoComplete="tel"
        defaultValue={v("phone")}
        error={errors.phone}
      />
      <Textarea
        label="Mensaje"
        name="message"
        rows={5}
        required
        defaultValue={v("message")}
        error={errors.message}
      />
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          name="newsletter"
          className="mt-1 h-4 w-4 accent-blue"
          defaultChecked={v("newsletter") === "on"}
        />
        <span>
          Deseo recibir actualizaciones de Tripcelona sobre rutas de exploración y ofertas
          especiales para grupos.
        </span>
      </label>
      <PrivacyConsent error={errors.privacy} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Enviando…" : "Enviar solicitud"}
      </Button>
    </form>
  );
}
