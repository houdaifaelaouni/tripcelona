"use server";

import { redirect } from "next/navigation";
import { getBookingDetails } from "@/lib/booking/details";
import { fieldErrors, formObject, type FormState } from "@/lib/forms/schema";
import { allowSubmission } from "@/lib/forms/rate-limit";
import { LOOKUP_NOT_FOUND, lookupSchema } from "./lookup-schema";

/**
 * Finds a booking by reference and email and opens its page. The booking's
 * page URL carries its id (an unguessable UUID), the same link the customer
 * got after paying. Rate limited per client, and it never says which of the
 * two fields was wrong.
 */
export async function lookupBooking(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formObject(form);
  const parsed = lookupSchema.safeParse(values);
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "website")) {
      return { status: "error", message: LOOKUP_NOT_FOUND, fieldErrors: {}, values };
    }
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors: fieldErrors(parsed.error),
      values,
    };
  }
  if (!(await allowSubmission("lookup"))) {
    return {
      status: "error",
      message: "Demasiados intentos seguidos. Espera unos minutos o escríbenos por WhatsApp.",
      fieldErrors: {},
      values,
    };
  }

  const booking = await getBookingDetails({ reference: parsed.data.reference });
  if (!booking || booking.email.toLowerCase() !== parsed.data.email) {
    return { status: "error", message: LOOKUP_NOT_FOUND, fieldErrors: {}, values };
  }
  redirect(
    booking.status === "pending"
      ? `/reservar/pendiente?id=${booking.id}`
      : `/reservar/confirmada?id=${booking.id}`,
  );
}
