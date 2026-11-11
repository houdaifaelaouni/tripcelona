import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/admin/flash";
import {
  PageTitle,
  Panel,
  REQUEST_LABELS,
  RequestStatus,
  Table,
  td,
  th,
} from "@/components/admin/ui";
import { cn } from "@/lib/cn";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { formatDateShort } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Solicitudes" };

const STATUSES = ["new", "quoted", "won", "lost"] as const;
type Status = (typeof STATUSES)[number];

/** FR-42/FR-84: quote requests and contact messages, filterable by status. */
export default async function Inbox({ searchParams }: PageProps<"/admin/solicitudes">) {
  await requireStaff("owner");
  const sp = await searchParams;
  const tab = sp.tipo === "mensajes" ? "mensajes" : "presupuestos";
  const status = STATUSES.includes(sp.estado as Status) ? (sp.estado as Status) : null;
  const db = await createClient();

  const href = (t: string, s: Status | null) =>
    `/admin/solicitudes?tipo=${t}${s ? `&estado=${s}` : ""}`;

  const [{ count: newQuotes }, { count: newMessages }] = await Promise.all([
    db.from("tour_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    db
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("source", "contact")
      .eq("status", "new"),
  ]);

  return (
    <>
      <PageTitle>Solicitudes</PageTitle>
      <Flash ok={sp.ok} error={sp.error} />
      <nav aria-label="Tipo" className="mb-4 flex flex-wrap gap-2">
        {[
          ["presupuestos", `Presupuestos (${newQuotes ?? 0} nuevas)`],
          ["mensajes", `Mensajes de contacto (${newMessages ?? 0} nuevos)`],
        ].map(([t, label]) => (
          <Link
            key={t}
            href={href(t, null)}
            aria-current={tab === t ? "page" : undefined}
            className={cn(
              "rounded-control border px-3 py-1.5 text-meta font-semibold",
              tab === t ? "border-navy bg-navy text-white" : "border-border bg-white text-blue",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <nav aria-label="Estado" className="mb-4 flex flex-wrap gap-3 text-meta">
        <Link
          href={href(tab, null)}
          aria-current={!status ? "true" : undefined}
          className={cn("underline", !status && "font-semibold")}
        >
          Todas
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={href(tab, s)}
            aria-current={status === s ? "true" : undefined}
            className={cn("underline", status === s && "font-semibold")}
          >
            {REQUEST_LABELS[s]}
          </Link>
        ))}
      </nav>
      {tab === "presupuestos" ? <Quotes status={status} /> : <Messages status={status} />}
    </>
  );
}

async function Quotes({ status }: { status: Status | null }) {
  const db = await createClient();
  let q = db
    .from("tour_requests")
    .select(
      "id, name, group_size, preferred_dates, status, created_at, email_error, tours ( title )",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (
    <Panel>
      <Table>
        <thead>
          <tr>
            <th className={th}>Recibida</th>
            <th className={th}>Nombre</th>
            <th className={th}>Plan</th>
            <th className={th}>Personas</th>
            <th className={th}>Fecha</th>
            <th className={th}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((r) => (
            <tr key={r.id}>
              <td className={td}>{formatDateShort(r.created_at)}</td>
              <td className={td}>
                <Link
                  href={`/admin/solicitudes/${r.id}`}
                  className="font-semibold text-blue underline"
                >
                  {r.name}
                </Link>
                {r.email_error && <div className="text-caption text-danger">Email no enviado</div>}
              </td>
              <td className={td}>{r.tours?.title ?? "Destino a medida"}</td>
              <td className={td}>{r.group_size ?? "—"}</td>
              <td className={td}>{r.preferred_dates ?? "—"}</td>
              <td className={td}>
                <RequestStatus status={r.status} />
              </td>
            </tr>
          ))}
          {(data ?? []).length === 0 && (
            <tr>
              <td className={td} colSpan={6}>
                No hay solicitudes{status ? " con este estado" : ""}.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Panel>
  );
}

async function Messages({ status }: { status: Status | null }) {
  const db = await createClient();
  let q = db
    .from("leads")
    .select("id, payload, status, created_at, email_error")
    .eq("source", "contact")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (
    <Panel>
      <Table>
        <thead>
          <tr>
            <th className={th}>Recibido</th>
            <th className={th}>Nombre</th>
            <th className={th}>Mensaje</th>
            <th className={th}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((m) => {
            const p = (m.payload ?? {}) as { name?: string; message?: string };
            return (
              <tr key={m.id}>
                <td className={td}>{formatDateShort(m.created_at)}</td>
                <td className={td}>
                  <Link
                    href={`/admin/solicitudes/mensajes/${m.id}`}
                    className="font-semibold text-blue underline"
                  >
                    {p.name ?? "—"}
                  </Link>
                  {m.email_error && (
                    <div className="text-caption text-danger">Email no enviado</div>
                  )}
                </td>
                <td className={`${td} max-w-md truncate`}>{p.message ?? ""}</td>
                <td className={td}>
                  <RequestStatus status={m.status} />
                </td>
              </tr>
            );
          })}
          {(data ?? []).length === 0 && (
            <tr>
              <td className={td} colSpan={4}>
                No hay mensajes{status ? " con este estado" : ""}.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Panel>
  );
}
