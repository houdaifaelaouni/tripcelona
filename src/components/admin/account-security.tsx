"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/browser";

export function ChangePassword() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  async function save(form: FormData) {
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password.length < 10) return setMsg({ ok: false, text: "Mínimo 10 caracteres." });
    if (password !== confirm) return setMsg({ ok: false, text: "Las contraseñas no coinciden." });
    const { error } = await createClient().auth.updateUser({ password });
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Contraseña guardada." });
  }
  return (
    <form action={save} className="flex max-w-sm flex-col gap-3">
      <Input
        label="Nueva contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
      />
      <Input
        label="Repite la contraseña"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
      />
      {msg && (
        <p
          role={msg.ok ? "status" : "alert"}
          className={msg.ok ? "text-sm text-success" : "text-sm text-danger"}
        >
          {msg.text}
        </p>
      )}
      <Button type="submit" className="self-start">
        Guardar contraseña
      </Button>
    </form>
  );
}

type Enrolling = { factorId: string; qr: string; secret: string };

/** Optional TOTP second factor (FR-80 "MFA available"). */
export function MfaSetup() {
  const [factors, setFactors] = useState<{ id: string; name: string }[]>([]);
  const [enrolling, setEnrolling] = useState<Enrolling>();
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    const { data } = await createClient().auth.mfa.listFactors();
    setFactors(
      (data?.totp ?? [])
        .filter((f) => f.status === "verified")
        .map((f) => ({ id: f.id, name: f.friendly_name ?? "App" })),
    );
  }, []);
  useEffect(() => {
    // Subscribe-style async load: state is set after the request resolves.
    let active = true;
    createClient()
      .auth.mfa.listFactors()
      .then(({ data }) => {
        if (active)
          setFactors(
            (data?.totp ?? [])
              .filter((f) => f.status === "verified")
              .map((f) => ({ id: f.id, name: f.friendly_name ?? "App" })),
          );
      });
    return () => {
      active = false;
    };
  }, []);

  async function start() {
    setError(undefined);
    const supabase = createClient();
    // Clear abandoned, unverified attempts first.
    const { data } = await supabase.auth.mfa.listFactors();
    for (const f of data?.all ?? [])
      if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data: enrolled, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `App ${new Date().toLocaleDateString("es-ES")}`,
    });
    if (error || !enrolled) return setError(error?.message ?? "No se pudo iniciar.");
    setEnrolling({
      factorId: enrolled.id,
      qr: enrolled.totp.qr_code,
      secret: enrolled.totp.secret,
    });
  }

  async function confirm(form: FormData) {
    if (!enrolling) return;
    const { error } = await createClient().auth.mfa.challengeAndVerify({
      factorId: enrolling.factorId,
      code: String(form.get("code") ?? "").replace(/\s/g, ""),
    });
    if (error) return setError("Código incorrecto.");
    setEnrolling(undefined);
    await load();
  }

  async function remove(id: string) {
    const { error } = await createClient().auth.mfa.unenroll({ factorId: id });
    if (error) return setError(error.message);
    await load();
  }

  return (
    <div className="flex flex-col gap-3">
      {factors.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {factors.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-3 rounded-control border border-border p-2 text-sm"
            >
              <span>✓ {f.name}</span>
              <button type="button" className="text-danger underline" onClick={() => remove(f.id)}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          Sin verificación en dos pasos. Recomendada para el propietario.
        </p>
      )}
      {enrolling ? (
        <form action={confirm} className="flex max-w-sm flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL from Supabase */}
          <img
            src={enrolling.qr}
            alt="Código QR para tu app de autenticación"
            width={180}
            height={180}
          />
          <p className="break-all text-xs text-muted">Clave manual: {enrolling.secret}</p>
          <Input
            label="Código de la app"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            error={error}
          />
          <Button type="submit" className="self-start">
            Activar
          </Button>
        </form>
      ) : (
        <>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="button" variant="secondary" className="self-start" onClick={start}>
            Añadir app de autenticación
          </Button>
        </>
      )}
    </div>
  );
}
