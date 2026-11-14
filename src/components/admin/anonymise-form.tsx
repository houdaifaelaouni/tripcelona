import { Button } from "@/components/admin/button";
import { Checkbox } from "@/components/admin/fields";
import { Panel } from "@/components/admin/ui";

/** GDPR erasure request: wipes the person's details from one message or request. */
export function AnonymiseForm({ action }: { action: (form: FormData) => Promise<void> }) {
  return (
    <Panel title="Protección de datos">
      <form action={action} className="flex flex-col gap-2 text-sm">
        <p className="text-tertiary">
          Si esta persona pide que borremos sus datos, anonimiza la solicitud: se borran nombre,
          email, teléfono, mensaje y notas.
        </p>
        <Checkbox
          name="confirm"
          required
          label="Anonimizar los datos personales. No se puede deshacer."
        />
        <Button type="submit" variant="outline" className="self-start text-error-primary">
          Anonimizar datos
        </Button>
      </form>
    </Panel>
  );
}
