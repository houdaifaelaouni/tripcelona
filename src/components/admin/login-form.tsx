"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
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
      <Card className="p-6">
        <h1 className="text-display-sm">Crear o recuperar contraseña</h1>
        <form action={reset} className="mt-4 flex flex-col gap-4">
          <Input label="Email" name="email" type="email" autoComplete="email" required />
          {resetState.info && (
            <p role="status" className="text-meta text-success">
              {resetState.info}
            </p>
          )}
          <Button type="submit" disabled={resetting}>
            Enviar enlace
          </Button>
          <button
            type="button"
            className="text-meta text-blue underline"
            onClick={() => setMode("login")}
          >
            Volver a iniciar sesión
          </button>
        </form>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h1 className="text-display-sm">Iniciar sesión</h1>
      {notice && (
        <p role="alert" className="mt-3 text-meta text-danger">
          {notice}
        </p>
      )}
      <form action={login} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <Input label="Email" name="email" type="email" autoComplete="username" required />
        <PasswordInput
          label="Contraseña"
          name="password"
          autoComplete="current-password"
          required
        />
        {loginState.error && (
          <p role="alert" className="text-meta text-danger">
            {loginState.error}
          </p>
        )}
        <Button type="submit" disabled={loggingIn}>
          {loggingIn ? "Entrando…" : "Entrar"}
        </Button>
        <button
          type="button"
          className="text-meta text-blue underline"
          onClick={() => setMode("reset")}
        >
          ¿Primera vez o has olvidado la contraseña?
        </button>
      </form>
    </Card>
  );
}
