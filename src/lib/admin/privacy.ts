/** True when a booking can be anonymised: closed, or its excursion has already happened. */
export function bookingCanBeAnonymised(
  status: string,
  departureStartsAt: string | null | undefined,
  now: number = Date.now(),
): boolean {
  if (status === "cancelled" || status === "refunded") return true;
  return status === "paid" && !!departureStartsAt && new Date(departureStartsAt).getTime() < now;
}
