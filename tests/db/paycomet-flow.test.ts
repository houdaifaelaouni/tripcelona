// End-to-end PAYCOMET payment flow against the local Supabase stack:
// start payment (hosted page URL) → signed notification → paid, replay is a
// no-op, a refused payment stays pending, cancel → refund through the REST API.
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { connectLocalSupabase, waitForSupabaseApi } from "./local-env";
import { notificationHash } from "@/lib/payments/paycomet";

const PASSWORD = "test-terminal-password";

connectLocalSupabase();
await waitForSupabaseApi();
Object.assign(process.env, {
  PAYMENT_PROVIDER: "paycomet",
  PAYCOMET_API_KEY: "test-key",
  PAYCOMET_TERMINAL: "89987",
  PAYCOMET_CUSTOMER_CODE: "ABC123",
  PAYCOMET_PASSWORD: PASSWORD,
  PAYCOMET_BASE_URL: "http://paycomet.invalid",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  OWNER_EMAIL: "owner@example.com",
  RESEND_API_KEY: "",
});

const { createAdminClient } = await import("@/lib/supabase/admin");
const { startPayment, handlePaycometNotification, cancelDeparture } =
  await import("@/lib/payments/service");

const db = createAdminClient();
const slug = `pcflow-${randomUUID().slice(0, 8)}`;
let departureId = "";
let bookingId = "";
let order = "";

function notification(overrides: Record<string, string> = {}) {
  const f: Record<string, string> = {
    AccountCode: "ABC123",
    TpvID: "89987",
    TransactionType: "1",
    Order: order,
    Amount: "16500",
    Currency: "EUR",
    BankDateTime: "20261113061500",
    Response: "OK",
    ErrorID: "0",
    AuthCode: "AC410397",
    ...overrides,
  };
  f.NotificationHash = notificationHash(PASSWORD, f);
  return f;
}

const realFetch = globalThis.fetch;
const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
  const u = String(url);
  if (!u.startsWith("http://paycomet.invalid")) return realFetch(url, init);
  const headers = init.headers as Record<string, string>;
  expect(headers["PAYCOMET-API-TOKEN"]).toBe("test-key");
  const body = JSON.parse(String(init.body));
  if (u.endsWith("/v1/form")) {
    expect(body.payment.amount).toBe("16500");
    expect(body.payment.terminal).toBe(89987);
    return new Response(
      JSON.stringify({
        errorCode: 0,
        challengeUrl: "https://challenge.paycomet.com/challenge?x=1",
      }),
    );
  }
  if (u.endsWith(`/v1/payments/${order}/refund`)) {
    expect(body.payment).toMatchObject({ amount: "16500", currency: "EUR", authCode: "AC410397" });
    return new Response(JSON.stringify({ errorCode: 0, order, authCode: "AC410397" }));
  }
  return new Response("{}", { status: 404 });
});

beforeAll(async () => {
  vi.stubGlobal("fetch", fetchMock);
  const { data: tour } = await db
    .from("tours")
    .insert({ slug, title: "PayComet flow", status: "published" })
    .select("id")
    .single();
  const { data: dep } = await db
    .from("tour_departures")
    .insert({
      tour_id: tour!.id,
      starts_at: new Date(Date.now() + 7 * 864e5).toISOString(),
      capacity: 4,
      price_cents: 5500,
    })
    .select("id")
    .single();
  departureId = dep!.id;
  const { data: hold } = await db.rpc("hold_seats", { p_departure_id: departureId, p_qty: 3 });
  const { data: booking } = await db
    .from("bookings")
    .insert({
      departure_id: departureId,
      customer_name: "Ana Prueba",
      email: "ana@example.com",
      travellers: 3,
      total_cents: 16500,
    })
    .select("id")
    .single();
  bookingId = booking!.id;
  await db.from("seat_holds").update({ booking_id: bookingId }).eq("id", hold!);
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await db.from("payments").delete().eq("booking_id", bookingId);
  await db.from("bookings").delete().eq("id", bookingId);
  await db.from("tours").delete().eq("slug", slug);
});

describe("PAYCOMET payment flow", () => {
  it("starts a payment and returns the hosted page URL", async () => {
    const result = await startPayment(bookingId);
    expect(result).toMatchObject({
      ok: true,
      kind: "redirect",
      url: "https://challenge.paycomet.com/challenge?x=1",
    });
    const { data: payment } = await db
      .from("payments")
      .select("provider, provider_ref, amount_cents")
      .eq("booking_id", bookingId)
      .single();
    expect(payment).toMatchObject({ provider: "paycomet", amount_cents: 16500 });
    order = payment!.provider_ref;
  });

  it("ignores a forged notification", async () => {
    const forged = notification();
    forged.Amount = "100";
    expect(await handlePaycometNotification(forged)).toBe("invalid_signature");
  });

  it("does not confirm a refused payment", async () => {
    expect(await handlePaycometNotification(notification({ Response: "KO", ErrorID: "105" }))).toBe(
      "failed",
    );
    const { data: b } = await db.from("bookings").select("status").eq("id", bookingId).single();
    expect(b!.status).toBe("pending");
  });

  it("acknowledges operations that are not card payments", async () => {
    expect(await handlePaycometNotification(notification({ TransactionType: "2" }))).toBe(
      "ignored",
    );
  });

  it("confirms the booking once, even when the notification is replayed", async () => {
    // A second attempt on the same order after a refusal is a new event.
    const n = notification();
    const first = await handlePaycometNotification(n);
    expect(["paid", "already_paid"]).toContain(first);
    expect(await handlePaycometNotification(n)).toBe("duplicate");
    const { data: b } = await db.from("bookings").select("status").eq("id", bookingId).single();
    expect(b!.status).toBe("paid");
  });

  it("cancelling the departure refunds the booking through PAYCOMET", async () => {
    const refundCalls = () =>
      fetchMock.mock.calls.filter(([u]) => String(u).endsWith("/refund")).length;
    const report = await cancelDeparture(departureId);
    expect(report.failed).toEqual([]);
    expect(report.refunded).toHaveLength(1);
    expect(refundCalls()).toBe(1);
    const { data: b } = await db.from("bookings").select("status").eq("id", bookingId).single();
    expect(b!.status).toBe("refunded");

    const again = await cancelDeparture(departureId);
    expect(again.refunded).toEqual([]);
    expect(refundCalls()).toBe(1);
  });
});
