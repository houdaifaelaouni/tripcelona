"use server";

import { redirect } from "next/navigation";
import { createPendingBooking } from "./create";
import { checkoutSchema, fieldErrors, type CheckoutField, type CheckoutState } from "./schema";

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
