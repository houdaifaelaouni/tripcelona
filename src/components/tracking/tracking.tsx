"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "@/components/i18n/link";
import { useT } from "@/components/i18n/provider";
import { buttonClasses } from "@/components/ui/button";
import {
  captureAttribution,
  getConsent,
  loadPixels,
  setConsent,
  track,
  trackPageView,
} from "@/lib/tracking/client";
import {
  anyTracking,
  type TrackEventName,
  type TrackingConfig,
  type TrackItem,
} from "@/lib/tracking/shared";

const OPEN_EVENT = "tc:cookie-settings";

/**
 * Remembers the ad campaign the visitor came from, asks for cookie consent
 * when a pixel is configured (Admin > Integraciones), and loads the pixels
 * only after "Aceptar". Without any pixel configured, no banner shows.
 */
export function Tracking({ config }: { config: TrackingConfig }) {
  const t = useT();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const first = useRef(true);
  const enabled = anyTracking(config);

  useEffect(() => {
    captureAttribution();
    if (!enabled) return;
    const consent = getConsent();
    if (consent === "granted") loadPixels(config);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads a cookie, only known after mount
    else if (consent === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, [config, enabled]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    captureAttribution();
    trackPageView();
  }, [path]);

  if (!open) return null;
  const choose = (value: "granted" | "denied") => {
    setConsent(value);
    setOpen(false);
    if (value === "granted") loadPixels(config);
    else if ((window as { __tcTracking?: unknown }).__tcTracking) location.reload();
  };
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-xl bg-primary p-4 shadow-xl ring-1 ring-secondary md:p-5"
    >
      <p id="cookie-title" className="font-semibold text-primary">
        {t("Cookies")}
      </p>
      <p className="mt-1 text-sm text-tertiary">
        {t(
          "Usamos cookies de medición y publicidad (Meta, TikTok, Google) para saber qué anuncios funcionan. Solo se activan si aceptas.",
        )}{" "}
        <Link href="/politica-de-cookies" className="underline underline-offset-2">
          {t("Más información")}
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonClasses({ size: "sm" })}
          onClick={() => choose("granted")}
        >
          {t("Aceptar")}
        </button>
        <button
          type="button"
          className={buttonClasses({ size: "sm", variant: "outline" })}
          onClick={() => choose("denied")}
        >
          {t("Rechazar")}
        </button>
      </div>
    </div>
  );
}

/** Footer link that reopens the banner, so consent can be withdrawn. */
export function CookieSettingsButton() {
  const t = useT();
  return (
    <button
      type="button"
      className="hover:text-primary"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
    >
      {t("Preferencias de cookies")}
    </button>
  );
}

/** Fires one standard event when the component mounts (once per key). */
export function TrackOnMount({
  name,
  items,
  eventId,
  orderId,
  onceKey,
}: {
  name: TrackEventName;
  items: TrackItem[];
  eventId?: string;
  orderId?: string;
  /** Fire at most once per browser for this key (e.g. a purchase). */
  onceKey?: string;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (getConsent() !== "granted") return;
    if (onceKey) {
      try {
        if (localStorage.getItem(`tc_once_${onceKey}`)) return;
        localStorage.setItem(`tc_once_${onceKey}`, "1");
      } catch {
        // storage blocked: fire anyway
      }
    }
    track(name, { items, eventId, orderId });
  }, [name, items, eventId, orderId, onceKey]);
  return null;
}
