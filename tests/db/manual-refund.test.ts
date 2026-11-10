// A cash/transfer booking refunds without calling Redsys (US-26).
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import { connectLocalSupabase, waitForSupabaseApi } from "./local-env";

connectLocalSupabase();
await waitForSupabaseApi();
process.env.RESEND_API_KEY = "";
const { createAdminClient } = await import("@/lib/supabase/admin");
const { createPendingBooking } = await import("@/lib/booking/create");
const { refundBooking } = await import("@/lib/payments/service");

const db = createAdminClient();
const slug = `manual-${randomUUID().slice(0, 8)}`;

afterAll(async () => {
  const { data: tour } = await db
    .from("tours")
    .select("id, tour_departures(id)")
    .eq("slug", slug)
    .single();
  const depIds = tour?.tour_departures.map((d) => d.id) ?? [];
  const { data: bookings } = await db.from("bookings").select("id").in("departure_id", depIds);
  const ids = (bookings ?? []).map((b) => b.id);
  await db.from("payments").delete().in("booking_id", ids);
  await db.from("bookings").delete().in("id", ids);
  await db.from("tours").delete().eq("slug", slug);
});

describe("manual booking refund", () => {
  it("marks a cash payment refunded and frees the seats, with no gateway call", async () => {
    const { data: tour } = await db
      .from("tours")
      .insert({ slug, title: "Manual", status: "published" })
      .select("id")
      .single();
    const { data: dep } = await db
      .from("tour_departures")
      .insert({
        tour_id: tour!.id,
        starts_at: new Date(Date.now() + 5 * 864e5).toISOString(),
        capacity: 5,
        price_cents: 4000,
      })
      .select("id")
      .single();
    const created = await createPendingBooking({
      departureId: dep!.id,
      travellers: 2,
      name: "Caja",
      email: "caja@example.com",
      phone: "",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    await db.rpc("confirm_hold", { p_hold_id: created.holdId, p_booking_id: created.bookingId });
    await db.from("payments").insert({
      booking_id: created.bookingId,
      provider: "manual",
      provider_ref: `cash-${created.reference}`,
      amount_cents: 8000,
      status: "succeeded",
    });
    await db.from("bookings").update({ status: "paid" }).eq("id", created.bookingId);

    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await refundBooking(created.bookingId, {
      releaseSeats: true,
      notify: false,
      scope: "booking",
    });
    expect(result).toEqual({ ok: true });
    expect(fetchSpy.mock.calls.some(([u]) => String(u).includes("redsys"))).toBe(false);
    fetchSpy.mockRestore();

    const { data: b } = await db
      .from("bookings")
      .select("status, payments(status)")
      .eq("id", created.bookingId)
      .single();
    expect(b).toEqual({ status: "refunded", payments: [{ status: "refunded" }] });
    const { data: d } = await db
      .from("tour_departures")
      .select("seats_taken")
      .eq("id", dep!.id)
      .single();
    expect(d!.seats_taken).toBe(0);
  });
});
