// End-to-end payment flow against the local Supabase stack (US-19, US-20, US-22):
// start payment → signed notification → paid, replay is a no-op, cancel → refund.
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { connectLocalSupabase, waitForSupabaseApi } from "./local-env";
import { encodeParameters, decodeParameters, sign } from "@/lib/payments/redsys";

const KEY = "sq7HjrUOBfKmC576ILgskD5srU870gJ7"; // Redsys public sandbox key

connectLocalSupabase();
await waitForSupabaseApi();
Object.assign(process.env, {
  REDSYS_MERCHANT_CODE: "999008881",
  REDSYS_TERMINAL: "1",
  REDSYS_SECRET_KEY: KEY,
  REDSYS_ENV: "test",
  REDSYS_BASE_URL: "http://redsys.invalid",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  OWNER_EMAIL: "owner@example.com",
  RESEND_API_KEY: "",
});

const { createAdminClient } = await import("@/lib/supabase/admin");
const { startPayment, handleRedsysNotification, cancelDeparture } =
  await import("@/lib/payments/service");

const db = createAdminClient();
const slug = `payflow-${randomUUID().slice(0, 8)}`;
let departureId = "";
let bookingId = "";
let order = "";

function signed(params: Record<string, string>) {
  const encoded = encodeParameters(params).replace(/\+/g, "-").replace(/\//g, "_");
  return { Ds_MerchantParameters: encoded, Ds_Signature: sign(KEY, params.Ds_Order, encoded) };
}

beforeAll(async () => {
  const { data: tour } = await db
    .from("tours")
    .insert({ slug, title: "Pay flow", status: "published" })
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

describe("Redsys payment flow", () => {
  it("starts a payment with the server-side amount", async () => {
    const result = await startPayment(bookingId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.action).toBe("http://redsys.invalid/sis/realizarPago");
    const params = decodeParameters(result.fields.Ds_MerchantParameters);
    expect(params.DS_MERCHANT_AMOUNT).toBe("16500");
    order = params.DS_MERCHANT_ORDER;
  });

  it("ignores a notification with a bad signature", async () => {
    const forged = signed({ Ds_Order: order, Ds_Amount: "16500", Ds_Response: "0000" });
    forged.Ds_Signature = sign(
      Buffer.alloc(24, 1).toString("base64"),
      order,
      forged.Ds_MerchantParameters,
    );
    expect(await handleRedsysNotification(forged)).toBe("invalid_signature");
  });

  it("confirms the booking once, even when the notification is replayed", async () => {
    const n = signed({
      Ds_Order: order,
      Ds_Amount: "16500",
      Ds_Response: "0000",
      Ds_TransactionType: "0",
      Ds_AuthorisationCode: "123456",
    });
    expect(await handleRedsysNotification(n)).toBe("paid");
    expect(await handleRedsysNotification(n)).toBe("duplicate");
    expect(await handleRedsysNotification(n)).toBe("duplicate");

    const { data: b } = await db.from("bookings").select("status").eq("id", bookingId).single();
    expect(b!.status).toBe("paid");
    const { data: payments } = await db
      .from("payments")
      .select("status")
      .eq("booking_id", bookingId);
    expect(payments!.filter((p) => p.status === "succeeded")).toHaveLength(1);
    const { data: events } = await db.from("payment_events").select("id").eq("provider_ref", order);
    expect(events).toHaveLength(1);
    const { data: emails } = await db
      .from("booking_emails")
      .select("kind, status, attempts")
      .eq("booking_id", bookingId)
      .order("kind");
    expect(emails).toEqual([
      { kind: "confirmation", status: "sent", attempts: 1 },
      { kind: "owner_alert", status: "sent", attempts: 1 },
    ]);
  });

  it("cancelling the departure refunds the booking through Redsys", async () => {
    const realFetch = globalThis.fetch;
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      if (!String(url).startsWith("http://redsys.invalid")) return realFetch(url, init);
      const req = JSON.parse(String(init.body)) as { Ds_MerchantParameters: string };
      const p = decodeParameters(req.Ds_MerchantParameters);
      expect(p.DS_MERCHANT_TRANSACTIONTYPE).toBe("3");
      expect(p.DS_MERCHANT_AMOUNT).toBe("16500");
      const reply = signed({
        Ds_Order: p.DS_MERCHANT_ORDER,
        Ds_Amount: p.DS_MERCHANT_AMOUNT,
        Ds_Response: "0900",
        Ds_TransactionType: "3",
      });
      return new Response(JSON.stringify({ Ds_SignatureVersion: "HMAC_SHA256_V1", ...reply }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const redsysCalls = () =>
      fetchMock.mock.calls.filter(([u]) => String(u).startsWith("http://redsys.invalid")).length;

    const report = await cancelDeparture(departureId);
    expect(report.failed).toEqual([]);
    expect(report.refunded).toHaveLength(1);
    expect(redsysCalls()).toBe(1);

    const { data: b } = await db.from("bookings").select("status").eq("id", bookingId).single();
    expect(b!.status).toBe("refunded");
    const { data: dep } = await db
      .from("tour_departures")
      .select("status, seats_taken")
      .eq("id", departureId)
      .single();
    expect(dep).toEqual({ status: "cancelled", seats_taken: 0 });

    // Running it again does not refund twice.
    const again = await cancelDeparture(departureId);
    expect(again.refunded).toEqual([]);
    expect(redsysCalls()).toBe(1);
  });
});
