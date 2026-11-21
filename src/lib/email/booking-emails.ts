import "server-only";
import { getBookingDetails } from "@/lib/booking/details";
import { siteUrl } from "@/lib/seo/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTicketBundle } from "@/lib/booking/passengers";
import { buildTicketPdf } from "@/lib/tickets/pdf";
import { sendEmail, type OutgoingEmail } from "./send";
import {
  cancellationEmail,
  confirmationEmail,
  ownerAlertEmail,
  ticketEmail,
  paymentFailedEmail,
  paymentRequestEmail,
  type EmailContent,
  type EmailKind,
} from "./templates";

export type SendResult = "sent" | "skipped" | "failed" | "no_recipient";

type Options = {
  force?: boolean;
  note?: string;
  refunded?: boolean;
  scope?: "departure" | "booking";
};

/**
 * Idempotent transactional email: one row per (booking, kind) in
 * booking_emails. A second call is skipped unless the first failed, or
 * `force` is set (the "resend confirmation" action).
 */
export async function sendBookingEmail(
  bookingId: string,
  kind: EmailKind,
  options: Options = {},
): Promise<SendResult> {
  const booking = await getBookingDetails({ id: bookingId });
  if (!booking) throw new Error(`Booking ${bookingId} not found`);

  const to = kind === "owner_alert" ? process.env.OWNER_EMAIL : booking.email;
  if (!to) return "no_recipient";

  const db = createAdminClient();
  const claimed = await claim(db, bookingId, kind, options.force ?? false);
  if (!claimed) return "skipped";

  const base = siteUrl();
  let content: EmailContent;
  let attachments: OutgoingEmail["attachments"];
  switch (kind) {
    case "confirmation":
      content = confirmationEmail(booking, {
        booking: `${base}/reservar/confirmada?id=${booking.id}`,
        calendar: `${base}/reservar/confirmada/calendario?id=${booking.id}`,
        passengers: `${base}/reservar/confirmada?id=${booking.id}#pasajeros`,
      });
      break;
    case "ticket": {
      const bundle = await getTicketBundle(booking);
      content = ticketEmail(booking, bundle.lines, {
        ticket: `${base}/reservar/ticket?id=${booking.id}`,
        pdf: `${base}/reservar/ticket/pdf?id=${booking.id}`,
      });
      attachments = [
        {
          filename: `tripcelona-ticket-${booking.reference}.pdf`,
          content: await buildTicketPdf(bundle),
          contentType: "application/pdf",
        },
      ];
      break;
    }
    case "owner_alert":
      content = ownerAlertEmail(booking, options.note);
      break;
    case "payment_failed":
      content = paymentFailedEmail(booking, `${base}/reservar/pendiente?id=${booking.id}`);
      break;
    case "payment_request":
      content = paymentRequestEmail(booking, `${base}/reservar/pendiente?id=${booking.id}`);
      break;
    case "cancellation":
      content = cancellationEmail(booking, options.refunded ?? false, options.scope);
      break;
  }

  try {
    const { id } = await sendEmail({
      to,
      ...content,
      attachments,
      idempotencyKey: `${booking.id}:${kind}:${claimed.attempts}`,
      replyTo: kind === "owner_alert" ? booking.email : process.env.OWNER_EMAIL,
    });
    await db
      .from("booking_emails")
      .update({ status: "sent", provider_id: id, error: null })
      .eq("id", claimed.id);
    return "sent";
  } catch (error) {
    await db
      .from("booking_emails")
      .update({ status: "failed", error: String(error).slice(0, 500) })
      .eq("id", claimed.id);
    console.error(`[email] ${kind} for ${booking.reference} failed`, error);
    return "failed";
  }
}

async function claim(
  db: ReturnType<typeof createAdminClient>,
  bookingId: string,
  kind: EmailKind,
  force: boolean,
): Promise<{ id: string; attempts: number } | null> {
  const inserted = await db
    .from("booking_emails")
    .upsert(
      { booking_id: bookingId, kind },
      { onConflict: "booking_id,kind", ignoreDuplicates: true },
    )
    .select("id, attempts")
    .maybeSingle();
  if (inserted.error) throw new Error(`booking_emails: ${inserted.error.message}`);
  if (inserted.data) return inserted.data;

  // Already exists: retry only a failed send, or when forced.
  const { data: row } = await db
    .from("booking_emails")
    .select("id, attempts, status")
    .eq("booking_id", bookingId)
    .eq("kind", kind)
    .single();
  if (!row || (!force && row.status !== "failed")) return null;
  const { data: updated } = await db
    .from("booking_emails")
    .update({ status: "sending", attempts: row.attempts + 1 })
    .eq("id", row.id)
    .eq("attempts", row.attempts) // lose the race rather than double-send
    .select("id, attempts")
    .maybeSingle();
  return updated ?? null;
}
