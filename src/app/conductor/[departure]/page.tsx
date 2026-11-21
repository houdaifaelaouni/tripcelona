import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DriverScanner } from "@/components/driver/driver-scanner";
import { getDepartureBoard } from "@/lib/tickets/boarding";
import { isDriverKey } from "@/lib/tickets/driver";
import { formatDateLong, formatTime } from "@/lib/tours/format";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The driver's boarding page for one departure, opened from a secret link
 * (no login): scan each ticket's QR with the phone camera, see who is on board.
 */
export default function DriverPage({ params, searchParams }: PageProps<"/conductor/[departure]">) {
  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-primary px-4 py-5">
      <Suspense fallback={<p className="text-tertiary">Cargando…</p>}>
        <Driver params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Driver({
  params,
  searchParams,
}: {
  params: PageProps<"/conductor/[departure]">["params"];
  searchParams: PageProps<"/conductor/[departure]">["searchParams"];
}) {
  await connection();
  const { departure } = await params;
  const k = (await searchParams).k;
  const key = (Array.isArray(k) ? k[0] : k) ?? "";
  if (!UUID.test(departure) || !isDriverKey(departure, key)) notFound();
  const board = await getDepartureBoard(departure);
  if (!board) notFound();
  return (
    <DriverScanner
      departureId={departure}
      driverKey={key}
      initial={board}
      heading={{
        title: board.title,
        when: `${formatDateLong(board.startsAt)} · ${formatTime(board.startsAt)}`,
      }}
    />
  );
}
