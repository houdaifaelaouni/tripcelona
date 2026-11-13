import "server-only";
import { sendBookingEmail } from "@/lib/email/booking-emails";
import { createAdminClient } from "@/lib/supabase/admin";
import { activeProvider, paycometConfig, paymentUrls, redsysConfig, stripeConfig } from "./config";
import {
  buildCheckoutSession,
  interpretEvent as interpretStripeEvent,
  verifyWebhook as verifyStripeWebhook,
} from "./stripe";
import {
  buildFormRequest as buildPaycometForm,
  buildRefundRequest as buildPaycometRefund,
  newOrderId as newPaycometOrder,
  OPERATION as PAYCOMET_OPERATION,
  verifyNotification as verifyPaycometNotification,
} from "./paycomet";
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
  | { ok: true; kind: "form"; action: string; fields: SignedRequest }
  | { ok: true; kind: "redirect"; url: string }
  | { ok: false; reason: "not_configured" | "not_found" | "not_pending" | "no_seats" };

/**
 * Prepare a card payment for a pending booking (US-19): make sure its seats
 * are still held (re-hold if the 15-minute hold lapsed), create a payment row
 * with a fresh order reference, and hand back what the browser needs: signed
 * form fields (Redsys) or the hosted page URL (PAYCOMET).
 */
export async function startPayment(bookingId: string): Promise<StartPaymentResult> {
  const provider = activeProvider();
  if (!provider) return { ok: false, reason: "not_configured" };
  const db = createAdminClient();

  const { data: booking } = await db
    .from("bookings")
    .select(
      "id, reference, status, departure_id, travellers, total_cents, customer_name, email, cart_id, tour_departures(tours(title))",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return { ok: false, reason: "not_found" };
  if (booking.status !== "pending") return { ok: false, reason: "not_pending" };

  // A cart is paid in one go: every booking in it must still be pending and held.
  let lines = [booking];
  if (booking.cart_id) {
    const { data: cart } = await db
      .from("bookings")
      .select(
        "id, reference, status, departure_id, travellers, total_cents, customer_name, email, cart_id, tour_departures(tours(title))",
      )
      .eq("cart_id", booking.cart_id)
      .order("created_at");
    lines = cart ?? [booking];
    if (lines.some((l) => l.status !== "pending")) return { ok: false, reason: "not_pending" };
  }
  for (const line of lines) {
    if (!(await ensureHold(line.id, line.departure_id, line.travellers)))
      return { ok: false, reason: "no_seats" };
  }
  const totalCents = lines.reduce((n, l) => n + l.total_cents, 0);

  const order = provider === "paycomet" ? newPaycometOrder() : newOrderId(); // Stripe reuses the same shape
  const { error } = await db.from("payments").insert({
    booking_id: booking.id,
    cart_id: booking.cart_id,
    provider,
    provider_ref: order,
    amount_cents: totalCents,
  });
  if (error) throw new Error(`Could not create payment: ${error.message}`);

  const description =
    lines.length === 1
      ? `${booking.reference} · ${booking.tour_departures.tours.title}`
      : `${lines.length} excursiones · ${lines.map((l) => l.reference).join(", ")}`;
  const urls = paymentUrls(booking.id);

  if (provider === "stripe") {
    const url = await createStripeSession(stripeConfig()!, {
      order,
      amountCents: totalCents,
      description,
      email: booking.email,
      okUrl: urls.okUrl,
      koUrl: urls.koUrl,
    });
    if (!url) {
      await db
        .from("payments")
        .update({ status: "failed" })
        .eq("provider", "stripe")
        .eq("provider_ref", order);
      return { ok: false, reason: "not_configured" };
    }
    return { ok: true, kind: "redirect", url };
  }

  if (provider === "paycomet") {
    const paycomet = paycometConfig()!;
    const url = await createPaycometForm(
      paycomet,
      buildPaycometForm(paycomet, {
        order,
        amountCents: totalCents,
        description,
        okUrl: urls.okUrl,
        koUrl: urls.koUrl,
      }),
    );
    if (!url) {
      await db
        .from("payments")
        .update({ status: "failed" })
        .eq("provider", "paycomet")
        .eq("provider_ref", order);
      return { ok: false, reason: "not_configured" };
    }
    return { ok: true, kind: "redirect", url };
  }

  const config = redsysConfig()!;
  const fields = buildPaymentRequest(config, {
    order,
    amountCents: totalCents,
    description,
    holder: booking.customer_name,
    ...urls,
  });
  return { ok: true, kind: "form", action: config.redirectUrl, fields };
}

/** POST /v1/checkout/sessions: Stripe answers with the URL of its hosted payment page. */
async function createStripeSession(
  config: NonNullable<ReturnType<typeof stripeConfig>>,
  payment: Omit<Parameters<typeof buildCheckoutSession>[0], "expiresAt">,
): Promise<string | null> {
  try {
    const res = await fetch(`${config.baseUrl}/v1/checkout/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${config.secretKey}`,
        // The same order never creates two sessions if the customer double-clicks.
        "Idempotency-Key": `checkout-${payment.order}`,
      },
      // Stripe needs at least 30 minutes; the seat hold is shorter, so a late
      // payment is caught by the amount/seat checks and refunded automatically.
      body: buildCheckoutSession({
        ...payment,
        expiresAt: Math.floor(Date.now() / 1000) + 31 * 60,
      }),
    });
    const json = (await res.json()) as { url?: string; error?: { message?: string } };
    if (res.ok && json.url) return json.url;
    console.error(`[stripe] checkout refused: HTTP ${res.status} ${json.error?.message ?? ""}`);
  } catch (error) {
    console.error(`[stripe] checkout request failed: ${String(error)}`);
  }
  return null;
}

/** POST /v1/form: PAYCOMET answers with the URL of its hosted payment page. */
async function createPaycometForm(
  config: NonNullable<ReturnType<typeof paycometConfig>>,
  body: ReturnType<typeof buildPaycometForm>,
): Promise<string | null> {
  try {
    const res = await fetch(`${config.baseUrl}/v1/form`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "PAYCOMET-API-TOKEN": config.apiKey,
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { errorCode?: number; challengeUrl?: string };
    if (res.ok && !json.errorCode && json.challengeUrl) return json.challengeUrl;
    console.error(`[paycomet] form refused: HTTP ${res.status}, errorCode ${json.errorCode}`);
  } catch (error) {
    console.error(`[paycomet] form request failed: ${String(error)}`);
  }
  return null;
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
  | "no_seats"
  | "ignored";

/** What a verified gateway notification says, whatever the gateway. */
type VerifiedResult = {
  provider: "redsys" | "paycomet" | "stripe";
  order: string;
  eventKey: string;
  authorized: boolean;
  amountCents: number | null;
  payload: Record<string, string>;
};

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
  return applyVerifiedResult({
    provider: "redsys",
    order: result.order,
    eventKey: [
      result.order,
      result.transactionType ?? "",
      result.response ?? "",
      result.params.Ds_AuthorisationCode ?? "",
    ].join(":"),
    authorized: result.authorized,
    amountCents: result.amountCents,
    payload: result.params,
  });
}

/**
 * Handle a Stripe webhook. `rawBody` must be the untouched request text: the
 * signature covers the exact bytes. Unrelated event types are acknowledged.
 */
export async function handleStripeWebhook(
  rawBody: string,
  signature: string | null,
): Promise<NotificationOutcome> {
  const config = stripeConfig();
  if (!config) return "not_configured";
  const event = verifyStripeWebhook(config.webhookSecret, rawBody, signature);
  if (!event) return "invalid_signature";
  const result = interpretStripeEvent(event);
  if (!result) return "ignored";
  return applyVerifiedResult({ provider: "stripe", ...result });
}

/**
 * Handle a PAYCOMET notification (URLNOTIFY). Only approved or refused card
 * payments (TransactionType 1) change a booking; refunds we made ourselves
 * (type 2) and other operation types are acknowledged and ignored.
 */
export async function handlePaycometNotification(
  fields: Record<string, string | null | undefined>,
): Promise<NotificationOutcome> {
  const config = paycometConfig();
  if (!config) return "not_configured";
  const result = verifyPaycometNotification(config, fields);
  if (!result) return "invalid_signature";
  if (result.transactionType !== PAYCOMET_OPERATION.authorization) return "ignored";
  return applyVerifiedResult({
    provider: "paycomet",
    order: result.order,
    eventKey: [
      result.order,
      result.transactionType,
      result.response,
      result.errorId,
      result.authCode ?? "",
    ].join(":"),
    authorized: result.authorized,
    amountCents: result.amountCents,
    payload: result.params,
  });
}

async function applyVerifiedResult(result: VerifiedResult): Promise<NotificationOutcome> {
  const db = createAdminClient();
  // PAYCOMET's hosted page may let the customer retry the same order after a
  // refusal. A verified approval must still confirm it, so reopen a payment
  // that an earlier refusal marked as failed (Redsys uses a new order per try).
  if (result.provider === "paycomet" && result.authorized) {
    await db
      .from("payments")
      .update({ status: "pending" })
      .eq("provider", "paycomet")
      .eq("provider_ref", result.order)
      .eq("status", "failed");
  }
  const { data: outcome, error } = await db.rpc("apply_payment_result", {
    p_provider: result.provider,
    p_provider_ref: result.order,
    p_event_key: result.eventKey,
    p_authorized: result.authorized,
    p_amount_cents: result.amountCents ?? -1,
    p_payload: result.payload,
  });
  if (error) throw new Error(`apply_payment_result: ${error.message}`);
  const typed = outcome as NotificationOutcome;

  if (typed === "duplicate" || typed === "unknown_order") return typed;

  const { data: payment } = await db
    .from("payments")
    .select("id, booking_id, cart_id")
    .eq("provider", result.provider)
    .eq("provider_ref", result.order)
    .single();
  if (!payment) return typed;

  if (typed === "paid") {
    // A cart payment confirms several bookings: each gets its own email.
    const ids = payment.cart_id
      ? (
          (
            await db
              .from("bookings")
              .select("id")
              .eq("cart_id", payment.cart_id)
              .order("created_at")
          ).data ?? []
        ).map((b) => b.id)
      : [payment.booking_id];
    for (const id of ids) {
      await sendBookingEmail(id, "confirmation");
      await sendBookingEmail(id, "owner_alert");
    }
  } else if (typed === "failed") {
    await sendBookingEmail(payment.booking_id, "payment_failed");
  } else {
    // Money was taken but the booking cannot use it: give it back.
    const refund = await refundPayment(payment.id);
    const portal = { paycomet: "PAYCOMET", stripe: "Stripe", redsys: "Redsys" }[result.provider];
    await sendBookingEmail(payment.booking_id, "owner_alert", {
      force: true,
      note: `Cobro devuelto automáticamente (${typed}${refund.ok ? "" : `, DEVOLUCIÓN FALLIDA: revisar en ${portal}`})`,
    });
  }
  return typed;
}

export type RefundResult = { ok: true } | { ok: false; error: string };

type PaymentRow = {
  id: string;
  provider_ref: string;
  amount_cents: number;
  refunded_cents: number;
  raw_event: unknown;
};

/**
 * Record a refund the gateway accepted. A whole-payment refund closes the
 * payment; a partial one (a single booking of a cart) only adds to
 * refunded_cents and closes the payment once everything has gone back.
 */
async function recordRefund(
  payment: Pick<PaymentRow, "id" | "amount_cents" | "refunded_cents">,
  partialCents: number | undefined,
  raw: unknown,
) {
  const refunded =
    partialCents === undefined ? payment.amount_cents : payment.refunded_cents + partialCents;
  await createAdminClient()
    .from("payments")
    .update({
      refunded_cents: refunded,
      status: refunded >= payment.amount_cents ? "refunded" : "succeeded",
      refunded_at: new Date().toISOString(),
      refund_raw: raw as never,
    })
    .eq("id", payment.id);
}

/**
 * Refund one succeeded payment through the Redsys REST API (transaction type
 * 3). Idempotent: an already refunded payment returns ok without calling
 * Redsys again.
 */
export async function refundPayment(
  paymentId: string,
  /** Refund only this much (one booking of a cart); omitted = the whole payment. */
  partialCents?: number,
): Promise<RefundResult> {
  const db = createAdminClient();
  const { data: payment } = await db
    .from("payments")
    .select("id, provider, provider_ref, amount_cents, refunded_cents, status, raw_event")
    .eq("id", paymentId)
    .single();
  if (!payment) return { ok: false, error: "Payment not found" };
  if (payment.status === "refunded") return { ok: true };
  if (payment.status !== "succeeded") return { ok: false, error: `Payment is ${payment.status}` };

  // Cash/transfer bookings taken in the admin: the owner returns the money
  // outside the site, so there is no gateway call, only the record.
  if (payment.provider === "manual") {
    await recordRefund(payment, partialCents, {
      method: "manual",
      note: "Devolución fuera de la web (efectivo/transferencia)",
    });
    return { ok: true };
  }

  if (payment.provider === "paycomet") return refundPaycomet(payment, partialCents);
  if (payment.provider === "stripe") return refundStripe(payment, partialCents);

  const config = redsysConfig();
  if (!config) return { ok: false, error: "Redsys is not configured" };

  // Refund what Redsys actually charged (differs only on amount_mismatch).
  const charged = Number((payment.raw_event as Record<string, string> | null)?.Ds_Amount);
  const amountCents =
    partialCents ?? (Number.isInteger(charged) && charged > 0 ? charged : payment.amount_cents);

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

  await recordRefund(payment, partialCents, verified.params);
  return { ok: true };
}

/** Refund through Stripe (POST /v1/refunds on the payment intent kept from the webhook). */
async function refundStripe(payment: PaymentRow, partialCents?: number): Promise<RefundResult> {
  const config = stripeConfig();
  if (!config) return { ok: false, error: "Stripe is not configured" };
  const event = (payment.raw_event ?? {}) as Record<string, string>;
  if (!event.payment_intent) return { ok: false, error: "Stripe payment intent not recorded" };
  const charged = Number(event.amount_total);
  const amountCents =
    partialCents ?? (Number.isInteger(charged) && charged > 0 ? charged : payment.amount_cents);

  let body: { id?: string; status?: string; error?: { message?: string } };
  try {
    const res = await fetch(`${config.baseUrl}/v1/refunds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${config.secretKey}`,
        "Idempotency-Key": `refund-${payment.id}-${payment.refunded_cents}-${amountCents}`,
      },
      body: new URLSearchParams({
        payment_intent: event.payment_intent,
        amount: String(amountCents),
      }),
    });
    body = (await res.json()) as typeof body;
    if (!res.ok) return { ok: false, error: `Stripe ${body.error?.message ?? res.status}` };
  } catch (error) {
    return { ok: false, error: `Stripe unreachable: ${String(error)}` };
  }
  if (body.status === "failed" || body.status === "canceled")
    return { ok: false, error: `Stripe refund ${body.status}` };

  await recordRefund(payment, partialCents, body);
  return { ok: true };
}

/**
 * Refund through PAYCOMET (POST /v1/payments/{order}/refund). It needs the
 * bank authorisation code from the paid notification, which is kept in the
 * payment's raw_event.
 */
async function refundPaycomet(payment: PaymentRow, partialCents?: number): Promise<RefundResult> {
  const config = paycometConfig();
  if (!config) return { ok: false, error: "PAYCOMET is not configured" };
  const event = (payment.raw_event ?? {}) as Record<string, string>;
  if (!event.AuthCode) return { ok: false, error: "PAYCOMET authorisation code not recorded" };
  // Refund what was charged (differs from the booking only on amount_mismatch).
  const charged = Number(event.Amount);
  const amountCents =
    partialCents ?? (Number.isInteger(charged) && charged > 0 ? charged : payment.amount_cents);

  let body: { errorCode?: number; error?: { message?: string } };
  try {
    const res = await fetch(
      `${config.baseUrl}/v1/payments/${encodeURIComponent(payment.provider_ref)}/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "PAYCOMET-API-TOKEN": config.apiKey,
        },
        body: JSON.stringify(
          buildPaycometRefund(config, {
            amountCents,
            authCode: event.AuthCode,
            originalIp: process.env.PAYCOMET_ORIGINAL_IP || "127.0.0.1",
          }),
        ),
      },
    );
    body = (await res.json()) as typeof body;
    if (!res.ok && !body.errorCode) body.errorCode = res.status;
  } catch (error) {
    return { ok: false, error: `PAYCOMET unreachable: ${String(error)}` };
  }
  if (body.errorCode) return { ok: false, error: `PAYCOMET ${body.errorCode}` };

  await recordRefund(payment, partialCents, body);
  return { ok: true };
}

/** Refund a paid booking and give its seats back (US-22, single booking). */
export async function refundBooking(
  bookingId: string,
  options: { releaseSeats: boolean; notify: boolean; scope: "departure" | "booking" },
): Promise<RefundResult> {
  const db = createAdminClient();
  const { data: booking } = await db
    .from("bookings")
    .select("status, total_cents, cart_id")
    .eq("id", bookingId)
    .single();
  if (!booking) return { ok: false, error: "Booking not found" };
  // A booking in a cart is covered by the cart's payment, which may be anchored on another booking.
  const { data: payments } = await db
    .from("payments")
    .select("id, cart_id")
    .or(
      booking.cart_id
        ? `booking_id.eq.${bookingId},cart_id.eq.${booking.cart_id}`
        : `booking_id.eq.${bookingId}`,
    )
    .in("status", ["succeeded", "refunded"]);
  for (const p of payments ?? []) {
    if (p.cart_id) {
      // Only this booking's share goes back, and only once.
      if (booking.status === "refunded") continue;
      const r = await refundPayment(p.id, booking.total_cents);
      if (!r.ok) return r;
    } else {
      const r = await refundPayment(p.id);
      if (!r.ok) return r;
    }
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
