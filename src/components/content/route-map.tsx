"use client";

/*
 * Route map for rich text ("routeMap" node): the stops of a trip, numbered in
 * order and joined by a dashed line, on OpenStreetMap tiles through Leaflet.
 * No API key. Leaflet only loads in the browser, after the map scrolls near
 * the viewport; until then (and without JavaScript) the numbered stop list
 * below the map is the content. The line is drawn stop to stop, so it shows
 * the order of the day, not the road the coach takes.
 */
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { MapPoint } from "@/lib/content/rich-text";
import { useT } from "@/components/i18n/provider";

const NAVY = "#003882";

export function RouteMap({ title, points }: { title?: string | null; points: MapPoint[] }) {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    const draw = async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !box.current) return;
      map = L.map(el, {
        scrollWheelZoom: false,
        dragging: !L.Browser.mobile,
        attributionControl: true,
      });
      map.attributionControl.setPrefix("Leaflet");
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      }).addTo(map);
      const latlngs = points.map((p) => L.latLng(p.lat, p.lng));
      if (latlngs.length > 1) {
        L.polyline(latlngs, { color: NAVY, weight: 3, opacity: 0.8, dashArray: "6 8" }).addTo(map);
      }
      points.forEach((p, i) => {
        L.marker([p.lat, p.lng], {
          title: p.name,
          icon: L.divIcon({
            className: "route-map-pin",
            html: `<span>${i + 1}</span>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        })
          .bindTooltip(`${i + 1}. ${p.name.replace(/[<>&"]/g, "")}`, {
            direction: "top",
            offset: [0, -14],
          })
          .addTo(map!);
      });
      if (latlngs.length === 1) map.setView(latlngs[0], 11);
      else map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 13 });
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void draw();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      map?.remove();
    };
  }, [points]);

  return (
    <figure className="route-map">
      <div
        ref={box}
        role="img"
        aria-label={title ?? t("Mapa de la ruta")}
        className="route-map-canvas"
      />
      <figcaption>
        {title && <strong>{title}</strong>}
        <ol>
          {points.map((p, i) => (
            <li key={`${p.name}-${i}`}>
              <span aria-hidden className="route-map-num">
                {i + 1}
              </span>
              {p.name}
            </li>
          ))}
        </ol>
        <span className="route-map-note">{t("Ruta aproximada, en el orden del día.")}</span>
      </figcaption>
    </figure>
  );
}
