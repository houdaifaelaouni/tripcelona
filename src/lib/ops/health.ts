/**
 * Daily health report for hypercare (US-41). Answers "is anything broken
 * that loses bookings or leaves a customer without an email?" from the
 * database alone. Error rate, 404s and Core Web Vitals live in Vercel
 * (Logs, Speed Insights): see docs/operations.md.
 *
 * `assessHealth` is pure, so the thresholds are unit-tested; `loadHealthInput`
 * reads the rows with a service-role client (owner-only callers).
 */

export type Severity = "P0" | "P1" | "P2";
export type HealthAlert = { severity: Severity; title: string; detail: string; refs: string[] };

export type HealthInput = {
  now: Date;
  hours: number;
  bookings: { reference: string; status: string; created_at: string }[];
  payments: { status: string; created_at: string }[];
  paymentEvents: { outcome: string | null; provider_ref: string; received_at: string }[];
  bookingEmails: {
    kind: string;
    status: string;
    updated_at: string;
    reference: string;
  }[];
  paidWithoutConfirmation: string[];
  formEmailErrors: { kind: "presupuesto" | "contacto"; created_at: string }[];
  staleHolds: number;
};

export type HealthReport = {
  hours: number;
  generatedAt: string;
  status: "ok" | "warning" | "critical";
  funnel: { started: number; paid: number; abandoned: number; conversion: number | null };
  paymentsFailed: number;
  emailsSent: number;
  alerts: HealthAlert[];
};

const MIN = 60_000;
/** A checkout still pending after this long was abandoned (the seat hold expired). */
export const ABANDONED_AFTER_MIN = 30;
/** An email stuck in "sending" this long never reached the provider. */
export const EMAIL_STUCK_MIN = 10;

export function assessHealth(input: HealthInput): HealthReport {
  const now = input.now.getTime();
  const since = now - input.hours * 60 * MIN;
  const inWindow = (t: string) => Date.parse(t) >= since;
  const alerts: HealthAlert[] = [];

  const bookings = input.bookings.filter((b) => inWindow(b.created_at));
  const paid = bookings.filter((b) => b.status === "paid" || b.status === "refunded").length;
  const abandoned = bookings.filter(
    (b) => b.status === "pending" && now - Date.parse(b.created_at) > ABANDONED_AFTER_MIN * MIN,
  ).length;

  if (input.staleHolds > 0) {
    alerts.push({
      severity: "P0",
      title: "Las plazas retenidas no se liberan",
      detail: `${input.staleHolds} retenciones caducadas siguen activas: el trabajo programado de Supabase (pg_cron) no se está ejecutando, y las salidas pueden aparecer completas sin estarlo.`,
      refs: [],
    });
  }

  const suspicious = input.paymentEvents.filter(
    (e) =>
      inWindow(e.received_at) && (e.outcome === "amount_mismatch" || e.outcome === "unknown_order"),
  );
  if (suspicious.length) {
    alerts.push({
      severity: "P0",
      title: "Notificaciones de pago que no cuadran",
      detail:
        "La pasarela de pago avisó de pagos con un importe distinto o de pedidos que no existen. Revisa la configuración de la pasarela (comercio y terminal) y estos pedidos en el portal del banco.",
      refs: [...new Set(suspicious.map((e) => e.provider_ref))],
    });
  }

  if (input.paidWithoutConfirmation.length) {
    alerts.push({
      severity: "P0",
      title: "Reservas pagadas sin email de confirmación",
      detail:
        "El cliente pagó pero no consta el email de confirmación. Reenvíalo desde Admin → Reservas o con `pnpm ops resend`.",
      refs: input.paidWithoutConfirmation,
    });
  }

  const badEmails = input.bookingEmails.filter(
    (e) =>
      inWindow(e.updated_at) &&
      (e.status === "failed" ||
        (e.status === "sending" && now - Date.parse(e.updated_at) > EMAIL_STUCK_MIN * MIN)),
  );
  if (badEmails.length) {
    alerts.push({
      severity: "P1",
      title: "Emails de reservas que no se enviaron",
      detail:
        "Algunos emails fallaron o se quedaron a medias. Revisa Resend (dominio verificado, clave) y reenvíalos.",
      refs: [...new Set(badEmails.map((e) => `${e.reference} (${e.kind})`))],
    });
  }

  const formErrors = input.formEmailErrors.filter((f) => inWindow(f.created_at));
  if (formErrors.length) {
    const quotes = formErrors.filter((f) => f.kind === "presupuesto").length;
    alerts.push({
      severity: "P1",
      title: "Avisos de formularios sin enviar",
      detail: `${formErrors.length} solicitudes se guardaron pero su email falló (${quotes} de presupuesto). Están en Admin → Solicitudes; revisa OWNER_EMAIL y Resend.`,
      refs: [],
    });
  }

  const failedPayments = input.payments.filter(
    (p) => inWindow(p.created_at) && p.status === "failed",
  ).length;
  const started = bookings.length;
  if (started >= 5 && failedPayments / started > 0.5) {
    alerts.push({
      severity: "P1",
      title: "Muchos pagos rechazados",
      detail: `${failedPayments} pagos rechazados para ${started} reservas iniciadas. Puede ser normal (tarjetas denegadas), pero si sigue, prueba un pago y revisa el TPV con el banco.`,
      refs: [],
    });
  }
  if (started >= 5 && paid === 0) {
    alerts.push({
      severity: "P1",
      title: "Ninguna reserva pagada",
      detail: `${started} reservas iniciadas y ninguna pagada. Haz una reserva de prueba para comprobar el pago.`,
      refs: [],
    });
  }
  if (abandoned > 0) {
    alerts.push({
      severity: "P2",
      title: "Reservas abandonadas",
      detail: `${abandoned} clientes empezaron una reserva y no pagaron. Puedes escribirles desde Admin → Reservas si quieres recuperarlas.`,
      refs: bookings
        .filter(
          (b) =>
            b.status === "pending" && now - Date.parse(b.created_at) > ABANDONED_AFTER_MIN * MIN,
        )
        .map((b) => b.reference),
    });
  }

  const order: Severity[] = ["P0", "P1", "P2"];
  alerts.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
  const status = alerts.some((a) => a.severity === "P0")
    ? "critical"
    : alerts.some((a) => a.severity === "P1")
      ? "warning"
      : "ok";

  return {
    hours: input.hours,
    generatedAt: input.now.toISOString(),
    status,
    funnel: { started, paid, abandoned, conversion: started ? paid / started : null },
    paymentsFailed: failedPayments,
    emailsSent: input.bookingEmails.filter((e) => inWindow(e.updated_at) && e.status === "sent")
      .length,
    alerts,
  };
}

type Db = ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>;

/** Reads the last `hours` of activity. Use a service-role client. */
export async function loadHealthInput(
  db: Db,
  hours: number,
  now = new Date(),
): Promise<HealthInput> {
  const since = new Date(now.getTime() - hours * 60 * MIN).toISOString();
  const staleBefore = new Date(now.getTime() - 10 * MIN).toISOString();
  const [bookings, payments, events, emails, paid, quotes, leads, holds] = await Promise.all([
    db.from("bookings").select("reference, status, created_at").gte("created_at", since),
    db.from("payments").select("status, created_at").gte("created_at", since),
    db
      .from("payment_events")
      .select("outcome, provider_ref, received_at")
      .gte("received_at", since),
    db
      .from("booking_emails")
      .select("kind, status, updated_at, bookings(reference)")
      .gte("updated_at", since),
    // Card payments only: manual (cash/transfer) bookings may skip the email on purpose.
    db
      .from("payments")
      .select("bookings(reference, booking_emails(kind, status))")
      .in("provider", ["redsys", "paycomet", "stripe"])
      .eq("status", "succeeded")
      .gte("updated_at", since)
      .lte("updated_at", staleBefore),
    db
      .from("tour_requests")
      .select("created_at")
      .not("email_error", "is", null)
      .gte("created_at", since),
    db.from("leads").select("created_at").not("email_error", "is", null).gte("created_at", since),
    db
      .from("seat_holds")
      .select("id", { count: "exact", head: true })
      .eq("status", "held")
      .lt("expires_at", staleBefore),
  ]);
  for (const r of [bookings, payments, events, emails, paid, quotes, leads, holds]) {
    if (r.error) throw new Error(`Health query failed: ${r.error.message}`);
  }
  return {
    now,
    hours,
    bookings: bookings.data ?? [],
    payments: payments.data ?? [],
    paymentEvents: events.data ?? [],
    bookingEmails: (emails.data ?? []).map((e) => ({
      kind: e.kind,
      status: e.status,
      updated_at: e.updated_at,
      reference: (e.bookings as { reference: string } | null)?.reference ?? "?",
    })),
    paidWithoutConfirmation: (paid.data ?? [])
      .map(
        (p) =>
          p.bookings as {
            reference: string;
            booking_emails: { kind: string; status: string }[];
          } | null,
      )
      .filter(
        (b): b is NonNullable<typeof b> =>
          !!b && !b.booking_emails.some((e) => e.kind === "confirmation" && e.status === "sent"),
      )
      .map((b) => b.reference),
    formEmailErrors: [
      ...(quotes.data ?? []).map((q) => ({
        kind: "presupuesto" as const,
        created_at: q.created_at,
      })),
      ...(leads.data ?? []).map((l) => ({ kind: "contacto" as const, created_at: l.created_at })),
    ],
    staleHolds: holds.count ?? 0,
  };
}
