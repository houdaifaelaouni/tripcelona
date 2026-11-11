import type { Metadata } from "next";
import { Flash } from "@/components/admin/flash";
import { PageTitle, Panel, Table, td, th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { inviteStaff, setStaffRole } from "@/lib/admin/team-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Equipo" };

export default async function TeamPage({ searchParams }: PageProps<"/admin/equipo">) {
  const me = await requireStaff("owner");
  const { ok, error } = await searchParams;
  const db = await createClient();
  const { data: members } = await db.rpc("staff_members");

  return (
    <>
      <PageTitle>Equipo</PageTitle>
      <Flash ok={ok} error={error} />
      <Panel title="Personas con acceso">
        <Table>
          <thead>
            <tr>
              <th className={th}>Email</th>
              <th className={th}>Último acceso</th>
              <th className={th}>Rol</th>
            </tr>
          </thead>
          <tbody>
            {(members ?? []).map((m) => (
              <tr key={m.id}>
                <td className={td}>
                  {m.email}
                  {m.full_name && <span className="block text-muted">{m.full_name}</span>}
                </td>
                <td className={td}>
                  {m.last_sign_in_at
                    ? new Intl.DateTimeFormat("es-ES", {
                        dateStyle: "short",
                        timeZone: "Europe/Madrid",
                      }).format(new Date(m.last_sign_in_at))
                    : "Invitación pendiente"}
                </td>
                <td className={td}>
                  {m.id === me.id ? (
                    "Propietario (tú)"
                  ) : (
                    <form action={setStaffRole.bind(null, m.id)} className="flex items-end gap-2">
                      <Select label="Rol" hideLabel name="role" defaultValue={m.role ?? "none"}>
                        <option value="owner">Propietario</option>
                        <option value="editor">Editor</option>
                        <option value="none">Quitar acceso</option>
                      </Select>
                      <Button type="submit" size="sm" variant="secondary" className="h-10">
                        Guardar
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
      <Panel title="Invitar a alguien">
        <p className="mb-3 text-meta text-muted">
          Los editores pueden cambiar textos de las excursiones. Solo el propietario ve reservas,
          datos de clientes, precios y plazas.
        </p>
        <form
          action={inviteStaff}
          className="grid max-w-2xl gap-3 md:grid-cols-[1fr_1fr_160px_auto] md:items-end"
        >
          <Input label="Email" name="email" type="email" required />
          <Input label="Nombre" name="fullName" />
          <Select label="Rol" name="role" defaultValue="editor">
            <option value="editor">Editor</option>
            <option value="owner">Propietario</option>
          </Select>
          <Button type="submit" className="h-10">
            Invitar
          </Button>
        </form>
      </Panel>
    </>
  );
}
