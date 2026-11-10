const MESSAGES: Record<string, string> = {
  guardado: "Cambios guardados. La web pública ya muestra la nueva versión.",
  salida_creada: "Salida creada.",
  salida_cancelada: "Salida cancelada.",
  reenviado: "Email reenviado.",
  reembolsado: "Reserva reembolsada.",
  cancelada: "Reserva cancelada y plazas liberadas.",
  creada: "Reserva creada.",
  invitado: "Invitación enviada.",
  rol: "Rol actualizado.",
  "solo-propietario": "Esa sección es solo para el propietario.",
};

/** One-line result banner driven by ?ok= / ?error= after a form post. */
export function Flash({ ok, error }: { ok?: string | string[]; error?: string | string[] }) {
  const okKey = Array.isArray(ok) ? ok[0] : ok;
  const err = Array.isArray(error) ? error[0] : error;
  if (err)
    return (
      <p
        role="alert"
        className="mb-4 rounded-card border border-danger/30 bg-danger/5 p-3 text-sm font-bold text-danger"
      >
        {err}
      </p>
    );
  if (okKey && MESSAGES[okKey])
    return (
      <p
        role="status"
        className="mb-4 rounded-card border border-success/30 bg-success/5 p-3 text-sm font-bold text-success"
      >
        {MESSAGES[okKey]}
      </p>
    );
  return null;
}
