import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/flash";
import { Facts, InboxStatusForm } from "@/components/admin/inbox-form";
import { PageTitle, Panel, RequestStatus } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { updateContactMessage } from "@/lib/admin/inbox-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mensaje de contacto" };

const when = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Madrid",
});

export default async function ContactMessage({
  params,
  searchParams,
}: PageProps<"/admin/solicitudes/mensajes/[id]">) {
  await requireStaff("owner");
  const { id } = await params;
  const { ok, error } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await createClient();
  const { data: m } = await db
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("source", "contact")
    .maybeSingle();
  if (!m) notFound();
  const p = (m.payload ?? {}) as {
    name?: string;
    email?: string;
    phone?: string | null;
    message?: string;
    newsletter?: boolean;
  };

  return (
    <>
      <PageTitle actions={<RequestStatus status={m.status} />}>Mensaje: {p.name ?? "—"}</PageTitle>
      <Flash ok={ok} error={error} />
      <Panel title="Mensaje">
        <Facts
          items={[
            ["Recibido", when.format(new Date(m.created_at))],
            ["Nombre", p.name ?? "—"],
            ["Email", p.email ?? "—"],
            ["Teléfono", p.phone ?? "—"],
            ["Quiere novedades", p.newsletter ? "Sí" : "No"],
            [
              "Mensaje",
              <span key="m" className="font-normal whitespace-pre-line">
                {p.message ?? ""}
              </span>,
            ],
            [
              "Emails automáticos",
              m.email_error ? (
                <span className="text-danger">No enviados: {m.email_error}</span>
              ) : m.notified_at ? (
                "Enviados"
              ) : (
                "Pendientes"
              ),
            ],
          ]}
        />
        {p.email && (
          <a
            className={`${buttonClasses()} mt-5`}
            href={`mailto:${p.email}?subject=${encodeURIComponent("Re: tu mensaje a Tripcelona")}`}
          >
            Responder por email
          </a>
        )}
      </Panel>
      <InboxStatusForm
        action={updateContactMessage.bind(null, m.id)}
        status={m.status}
        notes={m.admin_notes}
      />
      <Link href="/admin/solicitudes?tipo=mensajes" className="text-meta text-blue underline">
        ← Todos los mensajes
      </Link>
    </>
  );
}
