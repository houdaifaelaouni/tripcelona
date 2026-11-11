import { Alert, Toast } from "./alert";

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
  publicado: "Publicado. La web pública ya muestra la nueva versión.",
  borrador: "Borrador guardado. No se ve en la web hasta que lo publiques.",
  archivado: "Archivado. Ya no se ve en la web.",
  eliminado: "Eliminado.",
  subido: "Imagen subida.",
  estado: "Solicitud actualizada.",
  ajustes: "Ajustes guardados. La web ya muestra los nuevos datos.",
};

/**
 * Result of a form post, driven by ?ok= / ?error=. Errors stay inline above
 * the form; successes show as a toast.
 */
export function Flash({ ok, error }: { ok?: string | string[]; error?: string | string[] }) {
  const okKey = Array.isArray(ok) ? ok[0] : ok;
  const err = Array.isArray(error) ? error[0] : error;
  if (err)
    return (
      <Alert tone="error" title="No se ha podido guardar" className="mb-6">
        {err}
      </Alert>
    );
  if (okKey && MESSAGES[okKey]) return <Toast key={okKey} message={MESSAGES[okKey]} />;
  return null;
}
