"use client";

import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { BoardResult, DepartureBoard } from "@/lib/tickets/boarding";
import { driverBoard, driverScan } from "@/lib/tickets/driver-actions";
import { cn } from "@/lib/cn";

type Props = {
  departureId: string;
  driverKey: string;
  initial: DepartureBoard;
  heading: { title: string; when: string };
};

const MESSAGES: Record<BoardResult["status"], string> = {
  boarded: "A bordo",
  already: "Ya estaba a bordo",
  undone: "Embarque deshecho",
  not_found: "Ticket no válido",
  not_paid: "Reserva no pagada",
  other_departure: "Este ticket es de otra salida",
};

const TONE: Record<BoardResult["status"], string> = {
  boarded: "bg-success-solid text-white",
  undone: "bg-gray-700 text-white",
  already: "bg-yellow text-ink",
  not_found: "bg-error-solid text-white",
  not_paid: "bg-error-solid text-white",
  other_departure: "bg-error-solid text-white",
};

/**
 * Camera QR scanner for the bus door. Uses jsQR on video frames, so it works
 * on iPhone Safari as well as Android Chrome. One scan boards a whole booking.
 */
export function DriverScanner({ departureId, driverKey, initial, heading }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const busy = useRef(false);
  const last = useRef({ text: "", at: 0 });
  const [board, setBoard] = useState(initial);
  const [result, setResult] = useState<BoardResult | null>(null);
  const [camera, setCamera] = useState<"off" | "on" | "denied">("off");
  const [manual, setManual] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = useCallback(
    (text: string, undo = false) => {
      busy.current = true;
      startTransition(async () => {
        const res = await driverScan(departureId, driverKey, text, undo);
        if (res.board) setBoard(res.board);
        setResult(res.result);
        if (res.result && "vibrate" in navigator) {
          navigator.vibrate(res.result.status === "boarded" ? 120 : [80, 60, 80]);
        }
        // Give the driver time to read the result before the next scan.
        setTimeout(() => {
          busy.current = false;
        }, 1800);
      });
    },
    [departureId, driverKey],
  );

  // Camera loop.
  useEffect(() => {
    if (camera !== "on") return;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
      } catch {
        if (!cancelled) setCamera("denied");
        return;
      }
      const video = videoRef.current;
      if (!video || cancelled) return;
      video.srcObject = stream;
      await video.play().catch(() => undefined);
      timer = setInterval(() => {
        const canvas = canvasRef.current;
        if (busy.current || !canvas || video.readyState < 2) return;
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) return;
        const scale = Math.min(1, 640 / Math.max(w, h));
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
        if (!code?.data) return;
        // The same ticket stays in front of the camera: don't re-scan it for a few seconds.
        const now = Date.now();
        if (code.data === last.current.text && now - last.current.at < 6000) return;
        last.current = { text: code.data, at: now };
        submit(code.data);
      }, 250);
    })();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [camera, submit]);

  // Keep counters fresh when several phones board the same bus.
  useEffect(() => {
    const id = setInterval(async () => {
      const fresh = await driverBoard(departureId, driverKey);
      if (fresh) setBoard(fresh);
    }, 15000);
    return () => clearInterval(id);
  }, [departureId, driverKey]);

  const { totals } = board;
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold tracking-wide text-brand-secondary uppercase">
          Embarque · Tripcelona
        </p>
        <h1 className="mt-1 text-xl leading-tight font-semibold text-primary">{heading.title}</h1>
        <p className="text-sm text-tertiary first-letter:uppercase">{heading.when}</p>
      </header>

      <dl className="grid grid-cols-3 gap-2 text-center" aria-live="polite">
        <div className="rounded-xl bg-success-solid/10 p-3">
          <dt className="text-xs text-tertiary">A bordo</dt>
          <dd className="text-3xl font-semibold text-success-primary">{totals.boarded}</dd>
        </div>
        <div className="rounded-xl bg-secondary p-3">
          <dt className="text-xs text-tertiary">Faltan</dt>
          <dd className="text-3xl font-semibold text-primary">{totals.pending}</dd>
        </div>
        <div className="rounded-xl bg-secondary p-3">
          <dt className="text-xs text-tertiary">Tickets</dt>
          <dd className="text-3xl font-semibold text-primary">{totals.tickets}</dd>
        </div>
      </dl>

      <section className="overflow-hidden rounded-2xl bg-ink">
        {camera === "on" ? (
          <div className="relative aspect-square">
            <video ref={videoRef} playsInline muted className="size-full object-cover" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-[15%] rounded-2xl border-4 border-yellow/90"
            />
          </div>
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 p-6 text-center text-white">
            {camera === "denied" && (
              <p className="text-sm">
                No hay acceso a la cámara. Permítelo en el navegador o escribe la referencia abajo.
              </p>
            )}
            <button
              type="button"
              onClick={() => setCamera("on")}
              className="rounded-full bg-yellow px-6 py-3 text-lg font-semibold text-ink"
            >
              Escanear tickets
            </button>
          </div>
        )}
        <canvas ref={canvasRef} hidden />
      </section>

      {result && (
        <div
          role="status"
          className={cn("rounded-2xl p-4 text-center shadow-sm", TONE[result.status])}
        >
          <p className="text-2xl font-bold">{MESSAGES[result.status]}</p>
          {"name" in result ? (
            <p className="mt-1 text-lg">
              {result.name} · {result.travellers} {result.travellers === 1 ? "persona" : "personas"}
            </p>
          ) : (
            result.reference && <p className="mt-1">{result.reference}</p>
          )}
          {result.status === "boarded" && (
            <button
              type="button"
              className="mt-2 text-sm underline"
              onClick={() => submit(result.reference, true)}
            >
              Deshacer
            </button>
          )}
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (manual.trim()) submit(manual.trim());
          setManual("");
        }}
      >
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Referencia, ej. TC-2026-0042"
          aria-label="Referencia del ticket"
          autoCapitalize="characters"
          className="min-w-0 flex-1 rounded-lg px-3 py-2.5 ring-1 ring-primary ring-inset"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-solid px-4 font-semibold text-white"
        >
          Embarcar
        </button>
      </form>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-primary">Reservas ({totals.bookings})</h2>
        <ul className="divide-y divide-secondary rounded-2xl ring-1 ring-secondary ring-inset">
          {board.bookings.map((b) => {
            const done = b.boarded >= b.travellers;
            return (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  aria-hidden
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    done ? "bg-success-solid" : b.boarded ? "bg-yellow" : "bg-gray-300",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{b.customerName}</span>
                  <span className="block text-xs text-tertiary">
                    {b.reference} · {b.boarded}/{b.travellers} a bordo
                  </span>
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => submit(b.reference, done)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-semibold",
                    done
                      ? "text-tertiary ring-1 ring-secondary ring-inset"
                      : "bg-brand-solid text-white",
                  )}
                >
                  {done ? "Deshacer" : "Embarcar"}
                </button>
              </li>
            );
          })}
          {board.bookings.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-tertiary">
              Todavía no hay reservas pagadas para esta salida.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
