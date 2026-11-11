"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/admin/button";
import { Input } from "@/components/admin/fields";
import { PasswordInput } from "@/components/admin/password-input";
import { requestPasswordReset, signIn, type AuthFormState } from "@/lib/admin/auth-actions";

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [loginState, login, loggingIn] = useActionState<AuthFormState, FormData>(signIn, {});
  const [resetState, reset, resetting] = useActionState<AuthFormState, FormData>(
    requestPasswordReset,
    {},
  );

  if (mode === "reset") {
    return (
      <div>
        <h1 className="text-2xl leading-8 font-semibold text-primary md:text-3xl md:leading-9">
          Crear o recuperar contraseña
        </h1>
        <form action={reset} className="mt-8 flex flex-col gap-5">
          <Input label="Email" name="email" type="email" autoComplete="email" required />
          {resetState.info && (
            <p role="status" className="text-sm text-success-primary">
              {resetState.info}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={resetting}>
            Enviar enlace
          </Button>
          <button
            type="button"
            className="text-sm font-semibold text-brand-secondary hover:underline"
            onClick={() => setMode("login")}
          >
            Volver a iniciar sesión
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl leading-8 font-semibold text-primary md:text-3xl md:leading-9">
        Iniciar sesión
      </h1>
      <p className="mt-3 text-md text-tertiary">
        Bienvenido de nuevo. Entra con tu email del equipo.
      </p>
      {notice && (
        <p role="alert" className="mt-3 text-sm text-error-primary">
          {notice}
        </p>
      )}
      <form action={login} className="mt-8 flex flex-col gap-5">
        <input type="hidden" name="next" value={next} />
        <Input label="Email" name="email" type="email" autoComplete="username" required />
        <PasswordInput
          label="Contraseña"
          name="password"
          autoComplete="current-password"
          required
        />
        {loginState.error && (
          <p role="alert" className="text-sm text-error-primary">
            {loginState.error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loggingIn}>
          {loggingIn ? "Entrando…" : "Entrar"}
        </Button>
        <button
          type="button"
          className="text-sm font-semibold text-brand-secondary hover:underline"
          onClick={() => setMode("reset")}
        >
          ¿Primera vez o has olvidado la contraseña?
        </button>
      </form>
    </div>
  );
}
