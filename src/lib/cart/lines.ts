"use server";

import { z } from "zod";

import { MAX_CART_LINES, MAX_TRAVELLERS } from "@/lib/booking/schema";
import { createPublicClient } from "@/lib/supabase/public";

export type CartLine = {
  departureId: string;
  travellers: number;
  tourSlug: string;
  title: string;
  area: string | null;
  startsAt: string;
  unitCents: number;
  seatsLeft: number;
  /** Why this line cannot be bought now, in Spanish; null when it can. */
  problem: string | null;
};

const itemsSchema = z
  .array(
    z.object({
      departureId: z.uuid(),
      travellers: z.number().int().min(1).max(MAX_TRAVELLERS),
    }),
  )
  .max(MAX_CART_LINES);

/**
 * Current price and availability for the cart's lines (display only:
 * checkout recomputes everything from the database). Lines whose departure
 * no longer exists come back with a problem so the page can offer to remove them.
 */
export async function loadCartLines(raw: unknown): Promise<CartLine[]> {
  const parsed = itemsSchema.safeParse(raw);
  if (!parsed.success || parsed.data.length === 0) return [];
  const items = parsed.data;
  const { data, error } = await createPublicClient()
    .from("tour_departures")
    .select(
      "id, starts_at, capacity, seats_taken, price_cents, status, tours!inner(slug, title, area, status)",
    )
    .in(
      "id",
      items.map((i) => i.departureId),
    );
  if (error) throw new Error(`Failed to load cart: ${error.message}`);
  const byId = new Map((data ?? []).map((d) => [d.id, d]));
  return items.map((item) => {
    const d = byId.get(item.departureId);
    if (!d) {
      return {
        ...item,
        tourSlug: "",
        title: "Excursión no disponible",
        area: null,
        startsAt: "",
        unitCents: 0,
        seatsLeft: 0,
        problem: "Esta salida ya no está disponible.",
      };
    }
    const seatsLeft = Math.max(d.capacity - d.seats_taken, 0);
    const bookable =
      d.status === "open" && d.tours.status === "published" && new Date(d.starts_at) > new Date();
    const problem = !bookable
      ? "Esta salida ya no está disponible."
      : seatsLeft === 0
        ? "Salida completa."
        : item.travellers > seatsLeft
          ? `Solo quedan ${seatsLeft} plazas.`
          : null;
    return {
      ...item,
      tourSlug: d.tours.slug,
      title: d.tours.title,
      area: d.tours.area,
      startsAt: d.starts_at,
      unitCents: d.price_cents,
      seatsLeft,
      problem,
    };
  });
}
