import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/admin/flash";
import {
  EmptyState,
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
      <PageTitle description="Presupuestos de grupo y mensajes del formulario de contacto.">
        Solicitudes
      </PageTitle>
      <Flash ok={sp.ok} error={sp.error} />
      <nav aria-label="Tipo" className="mb-5 flex gap-6 overflow-x-auto border-b border-secondary">
        {[
          ["presupuestos", "Presupuestos", newQuotes ?? 0],
          ["mensajes", "Mensajes de contacto", newMessages ?? 0],
        ].map(([t, label, n]) => (
          <Link
            key={t}
            href={href(t as string, null)}
            aria-current={tab === t ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 py-3 text-sm font-semibold whitespace-nowrap",
              tab === t
                ? "border-navy text-brand-secondary"
                : "border-transparent text-tertiary hover:text-primary",
            )}
          >
            {label}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                tab === t ? "bg-brand-solid text-white" : "bg-secondary text-primary",
              )}
            >
              {n}
              <span className="sr-only"> sin atender</span>
            </span>
          </Link>
        ))}
      </nav>
      <nav
        aria-label="Estado"
        className="mb-5 inline-flex flex-wrap gap-1 rounded-lg border border-secondary bg-primary p-1"
      >
        {[null, ...STATUSES].map((s) => (
          <Link
            key={s ?? "todas"}
            href={href(tab, s)}
            aria-current={status === s ? "true" : undefined}
            className={cn(
              "rounded-[6px] px-3 py-1.5 text-sm font-semibold",
              status === s ? "bg-secondary text-primary" : "text-tertiary hover:text-primary",
            )}
          >
            {s ? REQUEST_LABELS[s] : "Todas"}
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
                  className="font-semibold text-brand-secondary hover:underline"
                >
                  {r.name}
                </Link>
                {r.email_error && (
                  <div className="text-xs text-error-primary">Email no enviado</div>
                )}
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
                <EmptyState illustration="inbox" title="Bandeja vacía">
                  No hay solicitudes{status ? " con este estado" : ""}.
                </EmptyState>
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
                    className="font-semibold text-brand-secondary hover:underline"
                  >
                    {p.name ?? "—"}
                  </Link>
                  {m.email_error && (
                    <div className="text-xs text-error-primary">Email no enviado</div>
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
                <EmptyState illustration="inbox" title="Bandeja vacía">
                  No hay mensajes{status ? " con este estado" : ""}.
                </EmptyState>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Panel>
  );
}
