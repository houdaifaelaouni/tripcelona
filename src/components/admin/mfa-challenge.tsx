"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/browser";

/** Second step for staff who enabled an authenticator app (US-24). */
export function MfaChallenge({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function verify(form: FormData) {
    setBusy(true);
    setError(undefined);
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    const factor = data?.totp.find((f) => f.status === "verified");
    if (!factor) {
      setError("No hay ninguna app de autenticación activa en esta cuenta.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: String(form.get("code") ?? "").replace(/\s/g, ""),
    });
    if (error) {
      setError("Código incorrecto. Prueba con el código actual de tu app.");
      setBusy(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <Card className="p-6">
      <h1 className="text-xl">Verificación en dos pasos</h1>
      <p className="mt-2 text-sm text-muted">
        Escribe el código de 6 dígitos de tu app de autenticación.
      </p>
      <form action={verify} className="mt-4 flex flex-col gap-4">
        <Input
          label="Código"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          required
          error={error}
        />
        <Button type="submit" disabled={busy}>
          Verificar
        </Button>
      </form>
    </Card>
  );
}
