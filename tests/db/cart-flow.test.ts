// Cart checkout against the local Supabase stack: several excursions, one
// payment, all bookings confirmed together, partial refunds per booking.
import { createHmac, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { connectLocalSupabase, waitForSupabaseApi } from "./local-env";

const WHSEC = "whsec_test_only";

connectLocalSupabase();
await waitForSupabaseApi();
Object.assign(process.env, {
  PAYMENT_PROVIDER: "stripe",
  STRIPE_SECRET_KEY: "sk_test_fake",
  STRIPE_WEBHOOK_SECRET: WHSEC,
  STRIPE_BASE_URL: "http://stripe.invalid",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  OWNER_EMAIL: "owner@example.com",
  RESEND_API_KEY: "",
});

const { createAdminClient } = await import("@/lib/supabase/admin");
const { createPendingCart } = await import("@/lib/booking/create");
const { startPayment, handleStripeWebhook, refundBooking } = await import("@/lib/payments/service");

const db = createAdminClient();
const slug = `cart-${randomUUID().slice(0, 8)}`;
const customer = { name: "Ana Carrito", email: "ana@example.com", phone: "+34600111222" };
let depA = "";
let depB = "";

const realFetch = globalThis.fetch;
const refunds: { intent: string | null; amount: string | null }[] = [];
const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
  const u = String(url);
  if (!u.startsWith("http://stripe.invalid")) return realFetch(url, init);
  const body = new URLSearchParams(String(init.body));
  if (u.endsWith("/v1/checkout/sessions")) {
    return new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/cs_cart" }));
  }
  if (u.endsWith("/v1/refunds")) {
    refunds.push({ intent: body.get("payment_intent"), amount: body.get("amount") });
    return new Response(JSON.stringify({ id: "re_1", status: "succeeded" }));
  }
  return new Response("{}", { status: 404 });
});

function paidEvent(order: string, amountCents: number) {
  const body = JSON.stringify({
    id: `evt_${randomUUID()}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_cart",
        client_reference_id: order,
        payment_status: "paid",
        amount_total: amountCents,
        currency: "eur",
        payment_intent: "pi_cart",
      },
    },
  });
  const t = Math.floor(Date.now() / 1000);
  const sig = `t=${t},v1=${createHmac("sha256", WHSEC).update(`${t}.${body}`).digest("hex")}`;
  return { body, sig };
}

async function seatsTaken(id: string) {
  const { data } = await db.from("tour_departures").select("seats_taken").eq("id", id).single();
  return data!.seats_taken;
}
async function bookingStatus(id: string) {
  const { data } = await db.from("bookings").select("status").eq("id", id).single();
  return data!.status;
}

beforeAll(async () => {
  vi.stubGlobal("fetch", fetchMock);
  const { data: tour } = await db
    .from("tours")
    .insert({ slug, title: "Cart flow", status: "published" })
    .select("id")
    .single();
  const mk = async (days: number, price: number) => {
    const { data } = await db
      .from("tour_departures")
      .insert({
        tour_id: tour!.id,
        starts_at: new Date(Date.now() + days * 864e5).toISOString(),
        capacity: 4,
        price_cents: price,
      })
      .select("id")
      .single();
    return data!.id;
  };
  depA = await mk(7, 5500);
  depB = await mk(14, 6000);
});

afterAll(async () => {
  vi.unstubAllGlobals();
  const { data: bookings } = await db
    .from("bookings")
    .select("id")
    .in("departure_id", [depA, depB]);
  const ids = (bookings ?? []).map((b) => b.id);
  await db.from("payments").delete().in("booking_id", ids);
  await db.from("bookings").delete().in("id", ids);
  await db.from("tours").delete().eq("slug", slug);
});

describe("cart checkout", () => {
  it("pays two excursions in one payment and confirms both", async () => {
    const cart = await createPendingCart(
      [
        { departureId: depA, travellers: 2 },
        { departureId: depB, travellers: 1 },
      ],
      customer,
    );
    expect(cart.ok).toBe(true);
    if (!cart.ok) return;
    expect(cart.totalCents).toBe(2 * 5500 + 6000);
    const { data: rows } = await db
      .from("bookings")
      .select("id, cart_id, total_cents")
      .in("id", cart.bookingIds);
    expect(new Set(rows!.map((r) => r.cart_id)).size).toBe(1);
    expect(rows![0].cart_id).not.toBeNull();

    const started = await startPayment(cart.anchorBookingId);
    expect(started).toMatchObject({ ok: true, kind: "redirect" });
    const { data: payment } = await db
      .from("payments")
      .select("id, provider_ref, amount_cents, cart_id")
      .eq("booking_id", cart.anchorBookingId)
      .single();
    expect(payment).toMatchObject({ amount_cents: cart.totalCents });
    expect(payment!.cart_id).toBe(rows![0].cart_id);

    const w = paidEvent(payment!.provider_ref, cart.totalCents);
    expect(await handleStripeWebhook(w.body, w.sig)).toBe("paid");
    expect(await handleStripeWebhook(w.body, w.sig)).toBe("duplicate");
    for (const id of cart.bookingIds) expect(await bookingStatus(id)).toBe("paid");

    // Refund the first booking only: its share goes back, the other stays paid.
    const [first, second] = cart.bookingIds;
    const firstTotal = rows!.find((r) => r.id === first)!.total_cents;
    expect(
      await refundBooking(first, { releaseSeats: true, notify: false, scope: "booking" }),
    ).toEqual({
      ok: true,
    });
    expect(refunds.at(-1)).toEqual({ intent: "pi_cart", amount: String(firstTotal) });
    expect(await bookingStatus(first)).toBe("refunded");
    expect(await bookingStatus(second)).toBe("paid");
    let { data: p } = await db
      .from("payments")
      .select("status, refunded_cents")
      .eq("id", payment!.id)
      .single();
    expect(p).toEqual({ status: "succeeded", refunded_cents: firstTotal });

    // Asking again does not refund twice.
    const calls = refunds.length;
    await refundBooking(first, { releaseSeats: true, notify: false, scope: "booking" });
    expect(refunds.length).toBe(calls);

    // Refunding the rest closes the payment.
    await refundBooking(second, { releaseSeats: true, notify: false, scope: "booking" });
    ({ data: p } = await db
      .from("payments")
      .select("status, refunded_cents")
      .eq("id", payment!.id)
      .single());
    expect(p).toEqual({ status: "refunded", refunded_cents: cart.totalCents });
  });

  it("gives the seats back when one excursion in the cart is sold out", async () => {
    const before = await seatsTaken(depA);
    const { data: hold } = await db.rpc("hold_seats", { p_departure_id: depB, p_qty: 4 });
    expect(hold).toBeTruthy();
    const cart = await createPendingCart(
      [
        { departureId: depA, travellers: 1 },
        { departureId: depB, travellers: 1 },
      ],
      customer,
    );
    expect(cart).toMatchObject({ ok: false, itemIndex: 1 });
    expect(await seatsTaken(depA)).toBe(before);
    await db.rpc("release_hold", { p_hold_id: hold! });
  });

  it("confirms nothing and refunds everything when seats vanish before payment", async () => {
    const cart = await createPendingCart(
      [
        { departureId: depA, travellers: 1 },
        { departureId: depB, travellers: 1 },
      ],
      customer,
    );
    expect(cart.ok).toBe(true);
    if (!cart.ok) return;
    await startPayment(cart.anchorBookingId);
    const { data: payment } = await db
      .from("payments")
      .select("id, provider_ref")
      .eq("booking_id", cart.anchorBookingId)
      .single();

    // The hold on the second excursion lapses and someone else takes every seat.
    await db.rpc("release_booking_seats", { p_booking_id: cart.bookingIds[1] });
    await db.rpc("hold_seats", { p_departure_id: depB, p_qty: 4 });

    const calls = refunds.length;
    const w = paidEvent(payment!.provider_ref, cart.totalCents);
    expect(await handleStripeWebhook(w.body, w.sig)).toBe("no_seats");
    for (const id of cart.bookingIds) expect(await bookingStatus(id)).toBe("pending");
    expect(refunds.length).toBe(calls + 1);
    expect(refunds.at(-1)).toEqual({ intent: "pi_cart", amount: String(cart.totalCents) });
    const { data: p } = await db.from("payments").select("status").eq("id", payment!.id).single();
    expect(p!.status).toBe("refunded");
  });
});
