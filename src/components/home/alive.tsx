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
              fill="#d9e9f7"
            />
            <text x="462" y="390" fontSize="13" fill="#4d97d6" fontStyle="italic">
              Mar Mediterráneo
            </text>
            {/* Pyrenees ridge */}
            <path
              d="M30 70 L60 52 L90 72 L120 46 L150 70 L190 40 L230 66 L270 44 L310 70 L350 50 L390 76 L430 58 L470 84 L510 70 L560 100"
              fill="none"
              stroke="#80b5e3"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <text x="250" y="30" fontSize="13" fill="#4d97d6" fontWeight="600">
              Pirineo
            </text>
            {/* Routes */}
            {destinations.map((d) => (
              <path
                key={d.area}
                data-draw
                d={routePath(points[d.area])}
                fill="none"
                stroke="#0071c2"
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
                    stroke="#0071c2"
                    strokeWidth="3"
                  />
                  <text
                    x={p.x + p.dx}
                    y={p.y + 4}
                    textAnchor={p.anchor}
                    fontSize="12"
                    fontWeight="600"
                    fill="#00224f"
                  >
                    {d.label.split(" y ")[0]}
                  </text>
                </g>
              );
            })}
            {/* Barcelona */}
            <circle cx={BCN.x} cy={BCN.y} r="18" fill="#0071c2" opacity="0.15" />
            <circle data-pop cx={BCN.x} cy={BCN.y} r="9" fill="#003580" />
            <text x={BCN.x - 14} y={BCN.y + 30} fontSize="14" fontWeight="700" fill="#003580">
              Barcelona
            </text>
            <text x="16" y="408" fontSize="11" fill="#4d97d6">
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

const steps = [
  { icon: Search, title: "Elige tu excursión", body: "Mira las próximas salidas y elige fecha." },
  {
    icon: CreditCard,
    title: "Reserva online",
    body: "Indica cuántas personas sois y paga con tarjeta.",
  },
  {
    icon: MailCheck,
    title: "Recibe la confirmación",
    body: "Te llega por email con todos los detalles.",
  },
  {
    icon: CalendarCheck,
    title: "¡A disfrutar!",
    body: "Te esperamos en el punto de salida el día de la excursión.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="como-heading" className="bg-secondary py-16 md:py-24">
      <div className="container-site">
        <SectionHeader
          id="como-heading"
          eyebrow="Cómo funciona"
          title="Reservar es muy fácil"
          lead="Cuatro pasos y tu plaza está asegurada."
        />
        <DrawOnScroll className="relative mt-12">
          {/* Connector line behind the steps (desktop). */}
          <svg
            aria-hidden
            viewBox="0 0 1000 8"
            preserveAspectRatio="none"
            className="absolute top-6 right-[12.5%] left-[12.5%] hidden h-2 w-3/4 lg:block"
          >
            <path
              data-draw
              d="M0 4 L1000 4"
              stroke="#80b5e3"
              strokeWidth="3"
              strokeDasharray="8 8"
              fill="none"
            />
          </svg>
          <ol className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="flex flex-col items-center text-center">
                <span data-pop className="relative">
                  <FeaturedIcon
                    icon={s.icon}
                    color="brand"
                    theme="gradient"
                    size="xl"
                    className="bg-primary"
                  />
                  <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-5 text-lg font-semibold text-primary">{s.title}</h3>
                <p className="mt-1 max-w-60 text-md text-tertiary">{s.body}</p>
              </li>
            ))}
          </ol>
        </DrawOnScroll>
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
      <SectionHeader
        id="calendario-heading"
        eyebrow="Calendario"
        title="Calendario de salidas"
        lead="Fechas, plazas y precios de las próximas excursiones."
      />
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
