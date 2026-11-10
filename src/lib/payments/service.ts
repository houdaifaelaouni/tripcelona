import "server-only";
import { sendBookingEmail } from "@/lib/email/booking-emails";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentUrls, redsysConfig } from "./config";
import {
  buildPaymentRequest,
  buildRefundRequest,
  isRefundAccepted,
  newOrderId,
  verifySignedMessage,
  type SignedRequest,
} from "./redsys";

const HOLD_TTL = "15 minutes";

export type StartPaymentResult =
  | { ok: true; action: string; fields: SignedRequest }
  | { ok: false; reason: "not_configured" | "not_found" | "not_pending" | "no_seats" };

/**
 * Prepare a Redsys redirect for a pending booking (US-19): make sure its seats
 * are still held (re-hold if the 15-minute hold lapsed), create a payment row
 * with a fresh Ds_Order, and return the signed form fields.
 */
export async function startPayment(bookingId: string): Promise<StartPaymentResult> {
  const config = redsysConfig();
  if (!config) return { ok: false, reason: "not_configured" };
  const db = createAdminClient();

  const { data: booking } = await db
    .from("bookings")
    .select(
      "id, reference, status, departure_id, travellers, total_cents, customer_name, tour_departures(tours(title))",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return { ok: false, reason: "not_found" };
  if (booking.status !== "pending") return { ok: false, reason: "not_pending" };

  if (!(await ensureHold(booking.id, booking.departure_id, booking.travellers)))
    return { ok: false, reason: "no_seats" };

  const order = newOrderId();
  const { error } = await db.from("payments").insert({
    booking_id: booking.id,
    provider: "redsys",
    provider_ref: order,
    amount_cents: booking.total_cents,
  });
  if (error) throw new Error(`Could not create payment: ${error.message}`);

  const fields = buildPaymentRequest(config, {
    order,
    amountCents: booking.total_cents,
    description: `${booking.reference} · ${booking.tour_departures.tours.title}`,
    holder: booking.customer_name,
    ...paymentUrls(booking.id),
  });
  return { ok: true, action: config.redirectUrl, fields };
}

/** True when the booking holds its seats (existing live hold, or a new one). */
export async function ensureHold(
  bookingId: string,
  departureId: string,
  travellers: number,
): Promise<boolean> {
  const db = createAdminClient();
  const { data: live } = await db
    .from("seat_holds")
    .select("id, status, expires_at")
    .eq("booking_id", bookingId)
    .in("status", ["held", "confirmed"])
    .gt("expires_at", new Date().toISOString())
    .limit(1);
  if (live?.length) {
    // Give the customer a full window on the payment page (never shorten a
    // longer hold, e.g. a manual booking waiting 24 h for payment).
    const window = new Date(Date.now() + 15 * 60_000).toISOString();
    if (live[0].expires_at < window)
      await db
        .from("seat_holds")
        .update({ expires_at: window })
        .eq("id", live[0].id)
        .eq("status", "held");
    return true;
  }
  // The old hold expired: free it now rather than waiting for the cron job.
  await db.rpc("release_booking_seats", { p_booking_id: bookingId });
  const { data: hold } = await db.rpc("hold_seats", {
    p_departure_id: departureId,
    p_qty: travellers,
    p_ttl: HOLD_TTL,
  });
  if (!hold) return false;
  await db.from("seat_holds").update({ booking_id: bookingId }).eq("id", hold);
  return true;
}

export type NotificationOutcome =
  | "invalid_signature"
  | "not_configured"
  | "duplicate"
  | "unknown_order"
  | "failed"
  | "paid"
  | "amount_mismatch"
  | "already_paid"
  | "booking_closed"
  | "no_seats";

/**
 * Handle a Redsys notification (US-20). The signature is verified before
 * anything is stored; the database function applies the result exactly once.
 * Side effects (emails, refunds) run only for the first delivery.
 */
export async function handleRedsysNotification(message: {
  Ds_MerchantParameters?: string | null;
  Ds_Signature?: string | null;
}): Promise<NotificationOutcome> {
  const config = redsysConfig();
  if (!config) return "not_configured";
  const result = verifySignedMessage(config.secretKey, message);
  if (!result) return "invalid_signature";

  const db = createAdminClient();
  const eventKey = [
    result.order,
    result.transactionType ?? "",
    result.response ?? "",
    result.params.Ds_AuthorisationCode ?? "",
  ].join(":");
  const { data: outcome, error } = await db.rpc("apply_payment_result", {
    p_provider: "redsys",
    p_provider_ref: result.order,
    p_event_key: eventKey,
    p_authorized: result.authorized,
    p_amount_cents: result.amountCents ?? -1,
    p_payload: result.params,
  });
  if (error) throw new Error(`apply_payment_result: ${error.message}`);
  const typed = outcome as NotificationOutcome;

  if (typed === "duplicate" || typed === "unknown_order") return typed;

  const { data: payment } = await db
    .from("payments")
    .select("id, booking_id")
    .eq("provider", "redsys")
    .eq("provider_ref", result.order)
    .single();
  if (!payment) return typed;

  if (typed === "paid") {
    await sendBookingEmail(payment.booking_id, "confirmation");
    await sendBookingEmail(payment.booking_id, "owner_alert");
  } else if (typed === "failed") {
    await sendBookingEmail(payment.booking_id, "payment_failed");
  } else {
    // Money was taken but the booking cannot use it: give it back.
    const refund = await refundPayment(payment.id);
    await sendBookingEmail(payment.booking_id, "owner_alert", {
      force: true,
      note: `Cobro devuelto automáticamente (${typed}${refund.ok ? "" : ", DEVOLUCIÓN FALLIDA: revisar en Redsys"})`,
    });
  }
  return typed;
}

export type RefundResult = { ok: true } | { ok: false; error: string };

/**
 * Refund one succeeded payment through the Redsys REST API (transaction type
 * 3). Idempotent: an already refunded payment returns ok without calling
 * Redsys again.
 */
export async function refundPayment(paymentId: string): Promise<RefundResult> {
  const db = createAdminClient();
  const { data: payment } = await db
    .from("payments")
    .select("id, provider, provider_ref, amount_cents, status, raw_event")
    .eq("id", paymentId)
    .single();
  if (!payment) return { ok: false, error: "Payment not found" };
  if (payment.status === "refunded") return { ok: true };
  if (payment.status !== "succeeded") return { ok: false, error: `Payment is ${payment.status}` };

  // Cash/transfer bookings taken in the admin: the owner returns the money
  // outside the site, so there is no gateway call, only the record.
  if (payment.provider === "manual") {
    await db
      .from("payments")
      .update({
        status: "refunded",
        refunded_at: new Date().toISOString(),
        refund_raw: {
          method: "manual",
          note: "Devolución fuera de la web (efectivo/transferencia)",
        },
      })
      .eq("id", payment.id);
    return { ok: true };
  }

  const config = redsysConfig();
  if (!config) return { ok: false, error: "Redsys is not configured" };

  // Refund what Redsys actually charged (differs only on amount_mismatch).
  const charged = Number((payment.raw_event as Record<string, string> | null)?.Ds_Amount);
  const amountCents = Number.isInteger(charged) && charged > 0 ? charged : payment.amount_cents;

  let body: Record<string, string>;
  try {
    const res = await fetch(config.restUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        buildRefundRequest(config, { order: payment.provider_ref, amountCents }),
      ),
    });
    body = (await res.json()) as Record<string, string>;
  } catch (error) {
    return { ok: false, error: `Redsys unreachable: ${String(error)}` };
  }
  if (body.errorCode) return { ok: false, error: `Redsys ${body.errorCode}` };

  const verified = verifySignedMessage(config.secretKey, body);
  if (!verified) return { ok: false, error: "Redsys response signature is invalid" };
  if (!isRefundAccepted(verified))
    return { ok: false, error: `Redsys refused the refund (Ds_Response ${verified.response})` };

  await db
    .from("payments")
    .update({
      status: "refunded",
      refunded_at: new Date().toISOString(),
      refund_raw: verified.params,
    })
    .eq("id", payment.id);
  return { ok: true };
}

/** Refund a paid booking and give its seats back (US-22, single booking). */
export async function refundBooking(
  bookingId: string,
  options: { releaseSeats: boolean; notify: boolean; scope: "departure" | "booking" },
): Promise<RefundResult> {
  const db = createAdminClient();
  const { data: payments } = await db
    .from("payments")
    .select("id")
    .eq("booking_id", bookingId)
    .in("status", ["succeeded", "refunded"]);
  for (const p of payments ?? []) {
    const r = await refundPayment(p.id);
    if (!r.ok) return r;
  }
  await db.from("bookings").update({ status: "refunded" }).eq("id", bookingId);
  if (options.releaseSeats) await db.rpc("release_booking_seats", { p_booking_id: bookingId });
  if (options.notify)
    await sendBookingEmail(bookingId, "cancellation", { refunded: true, scope: options.scope });
  return { ok: true };
}

export type CancelReport = {
  refunded: string[];
  cancelledPending: string[];
  failed: { reference: string; error: string }[];
};

/**
 * Cancel a departure (US-22): no more sales, every paid booking refunded and
 * notified, every pending booking cancelled with its seats released. Safe to
 * run again after a partial failure.
 */
export async function cancelDeparture(departureId: string): Promise<CancelReport> {
  const db = createAdminClient();
  const { error } = await db
    .from("tour_departures")
    .update({ status: "cancelled" })
    .eq("id", departureId);
  if (error) throw new Error(`Could not cancel departure: ${error.message}`);

  const report: CancelReport = { refunded: [], cancelledPending: [], failed: [] };
  const { data: bookings } = await db
    .from("bookings")
    .select("id, reference, status")
    .eq("departure_id", departureId)
    .in("status", ["paid", "pending"]);

  for (const b of bookings ?? []) {
    if (b.status === "pending") {
      await db.rpc("release_booking_seats", { p_booking_id: b.id });
      await db.from("bookings").update({ status: "cancelled" }).eq("id", b.id);
      report.cancelledPending.push(b.reference);
      continue;
    }
    const r = await refundBooking(b.id, { releaseSeats: true, notify: true, scope: "departure" });
    if (r.ok) report.refunded.push(b.reference);
    else report.failed.push({ reference: b.reference, error: r.error });
  }
  return report;
}
