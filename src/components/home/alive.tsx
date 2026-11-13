/*
 * Extra home sections: destinations map, "Cómo funciona" steps, live
 * stats and the departures table. Untitled UI layouts (MIT, see
 * THIRD_PARTY_NOTICES.md), animated with GSAP via components/motion.
 * Every number comes from published tours; nothing is invented.
 */
import { CalendarCheck, CreditCard, MailCheck, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { CountUp, DrawOnScroll, Reveal } from "@/components/motion/reveal";
import { FeaturedIcon } from "@/components/uui/foundations/featured-icon/featured-icon";
import { Badge } from "@/components/ui/card";
import { buildCatalogUrl } from "@/lib/search";
import { destinations, site } from "@/lib/site";
import { formatDateShort, formatDuration, formatPrice, formatTime } from "@/lib/tours/format";
import type { TourSummary } from "@/lib/tours/types";
import { SectionHeader } from "./sections";

/* Schematic positions (viewBox 600x420), projected from real lon/lat. */
const BCN = { x: 394, y: 307 };
const points: Record<string, { x: number; y: number; dx: number; anchor: "start" | "end" }> = {
  "la-garrotxa": { x: 451, y: 153, dx: 12, anchor: "start" },
  ripolles: { x: 397, y: 128, dx: -12, anchor: "end" },
  pallars: { x: 209, y: 81, dx: 12, anchor: "start" },
  osona: { x: 433, y: 189, dx: 12, anchor: "start" },
  huesca: { x: 68, y: 161, dx: 12, anchor: "start" },
};

function routePath(to: { x: number; y: number }) {
  const cx = (BCN.x + to.x) / 2 - (to.y - BCN.y) * 0.15;
  const cy = (BCN.y + to.y) / 2 - 30;
  return `M${BCN.x} ${BCN.y} Q${cx} ${cy} ${to.x} ${to.y}`;
}

export function DestinationsMap() {
  return (
    <section aria-labelledby="mapa-heading" className="container-site py-16 md:py-24">
      <SectionHeader
        id="mapa-heading"
        eyebrow="Destinos"
        title="Todas las rutas salen de Barcelona"
        lead={`Salida desde ${site.meetingPoint}. Elige destino y nosotros te llevamos.`}
      />
      <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <DrawOnScroll className="overflow-hidden rounded-2xl bg-brand-primary_alt ring-1 ring-secondary ring-inset">
          <svg
            viewBox="0 0 600 420"
            role="img"
            aria-labelledby="mapa-title"
            className="h-auto w-full"
          >
            <title id="mapa-title">
              Esquema de las rutas desde Barcelona a {destinations.map((d) => d.label).join(", ")}
            </title>
            {/* Sea */}
            <path
              d="M564 134 C540 200 470 260 394 307 C330 340 280 355 250 370 L180 420 L600 420 L600 134 Z"
              fill="#dbe8fe"
            />
            <text x="462" y="390" fontSize="13" fill="#6094fa" fontStyle="italic">
              Mar Mediterráneo
            </text>
            {/* Pyrenees ridge */}
            <path
              d="M30 70 L60 52 L90 72 L120 46 L150 70 L190 40 L230 66 L270 44 L310 70 L350 50 L390 76 L430 58 L470 84 L510 70 L560 100"
              fill="none"
              stroke="#93b8fd"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <text x="250" y="30" fontSize="13" fill="#6094fa" fontWeight="600">
              Pirineo
            </text>
            {/* Routes */}
            {destinations.map((d) => (
              <path
                key={d.area}
                data-draw
                d={routePath(points[d.area])}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="6 6"
              />
            ))}
            {/* Destinations */}
            {destinations.map((d) => {
              const p = points[d.area];
              return (
                <g key={d.area}>
                  <circle
                    data-pop
                    cx={p.x}
                    cy={p.y}
                    r="7"
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth="3"
                  />
                  <text
                    x={p.x + p.dx}
                    y={p.y + 4}
                    textAnchor={p.anchor}
                    fontSize="12"
                    fontWeight="600"
                    fill="#0f1011"
                  >
                    {d.label.split(" y ")[0]}
                  </text>
                </g>
              );
            })}
            {/* Barcelona */}
            <circle cx={BCN.x} cy={BCN.y} r="18" fill="#2563eb" opacity="0.15" />
            <circle data-pop cx={BCN.x} cy={BCN.y} r="9" fill="#0f1011" />
            <text x={BCN.x - 14} y={BCN.y + 30} fontSize="14" fontWeight="700" fill="#0f1011">
              Barcelona
            </text>
            <text x="16" y="408" fontSize="11" fill="#6094fa">
              Esquema orientativo, no a escala
            </text>
          </svg>
        </DrawOnScroll>
        <Reveal>
          <ul className="space-y-3">
            {destinations.map((d) => (
              <li key={d.area} data-reveal>
                <Link
                  href={buildCatalogUrl({ area: d.area, month: "", travellers: "" })}
                  className="group flex items-center gap-4 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary transition-shadow ring-inset hover:shadow-md"
                >
                  <FeaturedIcon icon={MapPin} color="brand" theme="light" size="md" />
                  <span className="flex-1 font-semibold text-primary group-hover:underline">
                    {d.label}
                  </span>
                  <span
                    aria-hidden
                    className="text-fg-quaternary transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

const stepIcons = [Search, CreditCard, MailCheck, CalendarCheck];

export function HowItWorks({
  title,
  steps,
}: {
  title: string;
  steps: { title: string; body: string }[];
}) {
  return (
    <section aria-labelledby="como-heading" className="border-t border-secondary py-16 md:py-24">
      <div className="container-site">
        <div className="flex items-center justify-between gap-10">
          <SectionHeader
            id="como-heading"
            eyebrow="Cómo funciona"
            title={title}
            lead="Cuatro pasos y tu plaza está asegurada."
          />
        </div>
        <Reveal>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-xl bg-border-secondary ring-1 ring-secondary sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => {
              const Icon = stepIcons[i % stepIcons.length];
              return (
                <li key={s.title} data-reveal className="flex flex-col gap-6 bg-primary p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-brand-primary text-fg-brand-primary ring-1 ring-brand-200/60 ring-inset">
                      <Icon aria-hidden className="size-[18px]" />
                    </span>
                    <span className="font-mono text-xs text-quaternary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-md font-semibold tracking-tight text-primary">{s.title}</h3>
                    <p className="mt-1.5 text-sm text-tertiary">{s.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

export function Stats({ tours }: { tours: TourSummary[] }) {
  const open = tours.flatMap((t) => t.departures.filter((d) => d.status === "open"));
  const prices = tours.map((t) => t.priceFromCents).filter((p): p is number => p !== null);
  const minPrice = prices.length ? Math.min(...prices) / 100 : null;
  const stats = [
    { value: tours.length, suffix: "", label: "Excursiones publicadas" },
    { value: destinations.length, suffix: "", label: "Destinos en Cataluña y Aragón" },
    { value: open.length, suffix: "", label: "Próximas salidas abiertas" },
    ...(minPrice !== null
      ? [{ value: minPrice, suffix: " €", label: "Precio desde, por persona" }]
      : []),
  ];
  return (
    <section aria-label="Tripcelona en cifras" className="container-site py-12 md:py-16">
      <Reveal>
        <dl className="grid grid-cols-2 gap-6 rounded-2xl bg-primary p-6 shadow-lg ring-1 ring-secondary ring-inset md:p-10 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} data-reveal className="flex flex-col-reverse gap-2 text-center">
              <dt className="text-md font-medium text-tertiary">{s.label}</dt>
              <dd className="text-4xl font-semibold tracking-tight text-brand-secondary md:text-5xl">
                <CountUp value={s.value} suffix={s.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

export function DeparturesTable({ tours }: { tours: TourSummary[] }) {
  const rows = tours
    .flatMap((t) => t.departures.filter((d) => d.status !== "cancelled").map((d) => ({ t, d })))
    .sort((a, b) => Date.parse(a.d.startsAt) - Date.parse(b.d.startsAt))
    .slice(0, 8);
  if (rows.length === 0) return null;
  const showDuration = rows.some(({ t }) => t.durationMinutes);
  return (
    <section aria-labelledby="calendario-heading" className="container-site pb-16 md:pb-24">
      <div className="flex items-center justify-between gap-10">
        <SectionHeader
          id="calendario-heading"
          eyebrow="Calendario"
          title="Calendario de salidas"
          lead="Fechas, plazas y precios de las próximas excursiones."
        />
      </div>
      <Reveal className="mt-10">
        <div
          data-reveal
          role="region"
          aria-labelledby="calendario-heading"
          tabIndex={0}
          className="overflow-x-auto rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset"
        >
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-secondary text-xs font-semibold text-quaternary">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3">
                  Excursión
                </th>
                <th scope="col" className="px-6 py-3">
                  Zona
                </th>
                {showDuration && (
                  <th scope="col" className="px-6 py-3">
                    Duración
                  </th>
                )}
                <th scope="col" className="px-6 py-3">
                  Plazas
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Precio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary">
              {rows.map(({ t, d }) => (
                <tr key={d.id} className="transition-colors hover:bg-primary_hover">
                  <td className="px-6 py-4 whitespace-nowrap text-primary">
                    <span className="font-medium first-letter:uppercase">
                      {formatDateShort(d.startsAt)}
                    </span>
                    <span className="block text-tertiary">{formatTime(d.startsAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/excursiones/${t.slug}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-tertiary">{t.area ?? "—"}</td>
                  {showDuration && (
                    <td className="px-6 py-4 whitespace-nowrap text-tertiary">
                      {t.durationMinutes ? formatDuration(t.durationMinutes) : "—"}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    {d.status === "sold_out" || d.seatsLeft <= 0 ? (
                      <Badge tone="danger">Completo</Badge>
                    ) : d.seatsLeft <= 10 ? (
                      <Badge tone="accent">Quedan {d.seatsLeft}</Badge>
                    ) : (
                      <Badge tone="success">{d.seatsLeft} libres</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold whitespace-nowrap text-primary">
                    {formatPrice(d.priceCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </section>
  );
}
