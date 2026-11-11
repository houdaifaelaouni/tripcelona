import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/field";

export function InboxStatusForm({
  action,
  status,
  notes,
}: {
  action: (form: FormData) => Promise<void>;
  status: string;
  notes: string | null;
}) {
  return (
    <Panel title="Seguimiento">
      <form action={action} className="space-y-4">
        <div className="w-56">
          <Select label="Estado" name="status" defaultValue={status}>
            <option value="new">Nueva</option>
            <option value="quoted">Presupuestada</option>
            <option value="won">Ganada</option>
            <option value="lost">Perdida</option>
          </Select>
        </div>
        <Textarea
          label="Notas internas"
          name="admin_notes"
          rows={5}
          defaultValue={notes ?? ""}
          hint="Solo las ve el equipo."
        />
        <Button type="submit">Guardar</Button>
      </form>
    </Panel>
  );
}

export function Facts({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[180px_1fr]">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="font-semibold break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
