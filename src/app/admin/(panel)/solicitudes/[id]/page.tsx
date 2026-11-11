import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/flash";
import { Facts, InboxStatusForm } from "@/components/admin/inbox-form";
import { PageTitle, Panel, RequestStatus } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { updateQuoteRequest } from "@/lib/admin/inbox-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Solicitud de presupuesto" };

const when = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Madrid",
});

export default async function QuoteRequest({
  params,
  searchParams,
}: PageProps<"/admin/solicitudes/[id]">) {
  await requireStaff("owner");
  const { id } = await params;
  const { ok, error } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await createClient();
  const { data: r } = await db
    .from("tour_requests")
    .select("*, tours ( title, slug )")
    .eq("id", id)
    .maybeSingle();
  if (!r) notFound();
  const plan = r.tours?.title ?? "Destino a medida";
  const subject = `Tu propuesta Tripcelona: ${plan}`;
  const wa = r.phone ? `https://wa.me/${r.phone.replace(/[^\d]/g, "")}` : null;

  return (
    <>
      <PageTitle
        back={{ href: "/admin/solicitudes", label: "Solicitudes" }}
        actions={<RequestStatus status={r.status} />}
      >
        Presupuesto: {r.name}
      </PageTitle>
      <Flash ok={ok} error={error} />
      <Panel title="Solicitud">
        <Facts
          items={[
            ["Recibida", when.format(new Date(r.created_at))],
            [
              "Plan",
              r.tours ? (
                <Link
                  className="text-blue hover:underline"
                  href={`/excursiones/${r.tours.slug}`}
                  target="_blank"
                >
                  {plan}
                </Link>
              ) : (
                plan
              ),
            ],
            ["Fecha preferida", r.preferred_dates ?? "—"],
            ["Personas", r.group_size ?? "—"],
            ["Extras", r.extras.length ? r.extras.join("; ") : "—"],
            ["Presupuesto", r.budget ?? "—"],
            ["Empresa o grupo", r.company ?? "—"],
            ["Nombre", r.name],
            ["Email", r.email],
            ["Teléfono / WhatsApp", r.phone ?? "—"],
            [
              "Mensaje",
              r.message ? (
                <span className="font-normal whitespace-pre-line">{r.message}</span>
              ) : (
                "—"
              ),
            ],
            [
              "Emails automáticos",
              r.email_error ? (
                <span className="text-danger">No enviados: {r.email_error}</span>
              ) : r.notified_at ? (
                "Enviados"
              ) : (
                "Pendientes"
              ),
            ],
          ]}
        />
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            className={buttonClasses()}
            href={`mailto:${r.email}?subject=${encodeURIComponent(subject)}`}
          >
            Responder por email
          </a>
          {wa && (
            <a
              className={buttonClasses({ variant: "whatsapp" })}
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
            >
              Escribir por WhatsApp
            </a>
          )}
        </div>
        <p className="mt-2 text-meta text-muted">
          Cuando envíes la propuesta, marca la solicitud como «Presupuestada».
        </p>
      </Panel>
      <InboxStatusForm
        action={updateQuoteRequest.bind(null, r.id)}
        status={r.status}
        notes={r.admin_notes}
      />
      <Link href="/admin/solicitudes" className="text-meta text-blue hover:underline">
        ← Todas las solicitudes
      </Link>
    </>
  );
}
