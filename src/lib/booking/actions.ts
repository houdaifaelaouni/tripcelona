"use server";

import { redirect } from "next/navigation";
import { createPendingBooking, createPendingCart } from "./create";
import {
  cartCheckoutSchema,
  checkoutSchema,
  fieldErrors,
  type CartCheckoutState,
  type CheckoutField,
  type CheckoutState,
} from "./schema";

function echo(form: FormData): Partial<Record<CheckoutField, string>> {
  const keys: CheckoutField[] = [
    "departureId",
    "travellers",
    "name",
    "email",
    "phone",
    "pickupNote",
  ];
  return Object.fromEntries(keys.map((k) => [k, String(form.get(k) ?? "")]));
}

/**
 * Validates checkout, then hands over to createPendingBooking (server price,
 * atomic seat hold, pending booking). Payment continues on the pending page.
 */
export async function startCheckout(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    // A filled honeypot gets the same generic answer as any invalid form.
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors: fieldErrors(parsed.error),
      values: echo(form),
    };
  }
  const input = parsed.data;

  const result = await createPendingBooking({
    departureId: input.departureId,
    travellers: input.travellers,
    name: input.name,
    email: input.email,
    phone: input.phone,
    pickupNote: input.pickupNote,
  });
  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      fieldErrors:
        result.reason === "not_enough_seats"
          ? { travellers: `Quedan ${result.seatsLeft} plazas.` }
          : {},
      values: echo(form),
    };
  }

  // Unguessable id in the URL (references are sequential).
  redirect(`/reservar/pendiente?id=${result.bookingId}`);
}

/**
 * Cart checkout: one pending booking per excursion, all held and paid in one
 * payment (createPendingCart is all-or-nothing). Single-line carts are
 * ordinary bookings.
 */
export async function startCartCheckout(
  _prev: CartCheckoutState,
  form: FormData,
): Promise<CartCheckoutState> {
  const values = Object.fromEntries(
    (["name", "email", "phone", "pickupNote"] as CheckoutField[]).map((k) => [
      k,
      String(form.get(k) ?? ""),
    ]),
  );
  const parsed = cartCheckoutSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const errs = fieldErrors(parsed.error as never);
    return {
      status: "error",
      message:
        parsed.error.issues.find((i) => i.path[0] === "items")?.message ??
        "Revisa los campos marcados.",
      fieldErrors: errs,
      values,
    };
  }
  const { items, name, email, phone, pickupNote } = parsed.data;
  const result = await createPendingCart(items, { name, email, phone, pickupNote });
  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: {}, values };
  }
  redirect(`/reservar/pendiente?id=${result.anchorBookingId}`);
}
