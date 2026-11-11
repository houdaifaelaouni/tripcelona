"use client";

/**
 * Dashboard charts after the Untitled UI line and bar chart examples
 * (MIT, © 2025 Untitled UI; tooltip/legend from the vendored charts-base),
 * drawn with Recharts in the Tripcelona brand scale.
 */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartLegendContent,
  ChartTooltipContent,
} from "@/components/uui/application/charts/charts-base";

const eur = (cents: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Madrid",
  });

export function SalesChart({
  data,
}: {
  data: { date: string; cents: number; bookings: number }[];
}) {
  return (
    <div
      className="h-64 w-full"
      role="img"
      aria-label="Ventas pagadas por día en los últimos 30 días"
    >
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          className="text-tertiary [&_.recharts-text]:text-xs"
        >
          <defs>
            <linearGradient id="sales-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="currentColor"
                className="text-utility-brand-600"
                stopOpacity="0.5"
              />
              <stop
                offset="95%"
                stopColor="currentColor"
                className="text-utility-brand-600"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="currentColor"
            className="text-utility-neutral-100"
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tickFormatter={day}
            minTickGap={24}
            fill="currentColor"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v) => eur(Number(v))}
            fill="currentColor"
          />
          <Tooltip
            content={<ChartTooltipContent />}
            formatter={(v) => eur(Number(v))}
            labelFormatter={(v) => day(String(v))}
            cursor={{ className: "stroke-utility-brand-600 stroke-2" }}
          />
          <Area
            isAnimationActive={false}
            dataKey="cents"
            name="Ventas"
            type="monotone"
            stroke="currentColor"
            className="text-utility-brand-600"
            strokeWidth={2}
            fill="url(#sales-gradient)"
            activeDot={{ className: "fill-bg-primary stroke-utility-brand-600 stroke-2" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OccupancyChart({
  data,
}: {
  data: { label: string; taken: number; free: number }[];
}) {
  return (
    <div
      className="h-64 w-full"
      role="img"
      aria-label="Plazas vendidas y libres en las próximas salidas"
    >
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          className="text-tertiary [&_.recharts-text]:text-xs"
        >
          <CartesianGrid
            vertical={false}
            stroke="currentColor"
            className="text-utility-neutral-100"
          />
          <Legend
            align="right"
            verticalAlign="top"
            content={<ChartLegendContent className="pb-3" />}
          />
          <XAxis dataKey="label" axisLine={false} tickLine={false} fill="currentColor" />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={32}
            allowDecimals={false}
            fill="currentColor"
          />
          <Tooltip
            content={<ChartTooltipContent />}
            cursor={{ className: "fill-utility-neutral-50" }}
          />
          <Bar
            isAnimationActive={false}
            dataKey="taken"
            name="Vendidas"
            stackId="a"
            fill="currentColor"
            className="text-utility-brand-600"
            maxBarSize={28}
          />
          <Bar
            isAnimationActive={false}
            dataKey="free"
            name="Libres"
            stackId="a"
            fill="currentColor"
            className="text-utility-brand-200"
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
