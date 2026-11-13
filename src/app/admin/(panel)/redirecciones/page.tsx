import type { Metadata } from "next";
import { Flash } from "@/components/admin/flash";
import { Button } from "@/components/admin/button";
import { Input, Select } from "@/components/admin/fields";
import { EmptyState, PageTitle, Panel, Table, td, th } from "@/components/admin/ui";
import { deleteRedirect, saveRedirect } from "@/lib/admin/redirect-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Redirecciones" };

const LABELS: Record<number, string> = {
  301: "301 permanente",
  302: "302 temporal",
  307: "307 temporal",
  308: "308 permanente",
  410: "410 eliminada",
};

/** Old address -> new address, applied by the site within a minute of saving. */
export default async function Redirects({ searchParams }: PageProps<"/admin/redirecciones">) {
  await requireStaff("owner");
  const { ok, error } = await searchParams;
  const db = await createClient();
  const { data: rows } = await db
    .from("redirects")
    .select("id, from_path, to_path, status_code")
    .order("from_path")
    .limit(500);

  return (
    <>
      <PageTitle description="Cuando cambies o borres una página, redirige la dirección antigua para no perder visitas ni posicionamiento en Google.">
        Redirecciones
      </PageTitle>
      <Flash ok={ok} error={error} />
      <Panel title="Añadir redirección">
        <form
          action={saveRedirect}
          className="grid items-end gap-3 md:grid-cols-[1fr_1fr_200px_auto]"
        >
          <Input
            label="Dirección antigua"
            name="from_path"
            placeholder="/viejo-articulo"
            required
          />
          <Input
            label="Nueva dirección"
            name="to_path"
            placeholder="/blog/nuevo-articulo"
            hint="Vacía si la página ya no existe (410)."
          />
          <Select label="Tipo" name="status_code" defaultValue="301">
            {Object.entries(LABELS).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </Select>
          <Button type="submit">Guardar</Button>
        </form>
      </Panel>
      <div className="mt-6">
        <Panel title="Redirecciones activas">
          {rows?.length ? (
            <Table>
              <thead>
                <tr>
                  <th className={th}>Antigua</th>
                  <th className={th}>Nueva</th>
                  <th className={th}>Tipo</th>
                  <th className={th}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className={`${td} font-mono text-xs`}>{r.from_path}</td>
                    <td className={`${td} font-mono text-xs`}>{r.to_path || "-"}</td>
                    <td className={td}>{LABELS[r.status_code]}</td>
                    <td className={td}>
                      <form action={deleteRedirect.bind(null, r.id)}>
                        <Button type="submit" size="sm" variant="secondary">
                          Eliminar
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState illustration="tickets" title="Todavía no hay redirecciones">
              Las direcciones antiguas de WordPress ya se redirigen solas; aquí añades las tuyas.
            </EmptyState>
          )}
        </Panel>
      </div>
    </>
  );
}
