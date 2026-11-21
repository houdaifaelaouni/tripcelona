"use server";

import { boardBooking, getDepartureBoard, type BoardResult, type DepartureBoard } from "./boarding";
import { isDriverKey, referenceFromScan } from "./driver";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DriverResponse = { result: BoardResult | null; board: DepartureBoard | null };

function allowed(departureId: string, key: string) {
  return UUID.test(departureId) && typeof key === "string" && isDriverKey(departureId, key);
}

/** The driver scanned a QR (or typed a reference): board that booking. */
export async function driverScan(
  departureId: string,
  key: string,
  scanned: string,
  undo = false,
): Promise<DriverResponse> {
  if (!allowed(departureId, key)) return { result: null, board: null };
  const reference = referenceFromScan(String(scanned).slice(0, 500));
  const result: BoardResult = reference
    ? await boardBooking(departureId, reference, { undo })
    : { status: "not_found", reference: null };
  return { result, board: await getDepartureBoard(departureId) };
}

/** Fresh counters, polled by the driver page so two phones stay in sync. */
export async function driverBoard(
  departureId: string,
  key: string,
): Promise<DepartureBoard | null> {
  if (!allowed(departureId, key)) return null;
  return getDepartureBoard(departureId);
}
