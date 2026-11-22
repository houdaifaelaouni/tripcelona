"use client";

/**
 * Alert rules editor (layout after the shadcn.io "Alert rules settings"
 * block): the rules as sentences with a toggle and how often each would
 * have fired, then the selected rule as an editable sentence with a live
 * preview chart against today's data. Saves all four rules at once.
 */
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cx } from "@/components/uui/utils/cx";
import { Button } from "@/components/admin/button";
import {
  ACTION_LABELS,
  LIMITS,
  evaluateRule,
  headline,
  ruleSentence,
  type AlertAction,
  type AlertData,
  type AlertRule,
} from "@/lib/ops/alert-rules";

const TITLES: Record<AlertRule["id"], string> = {
  high_fill: "Salida casi llena",
  low_fill: "Salida con pocas ventas",
  unanswered_requests: "Presupuesto sin responder",
  abandoned: "Reservas sin pagar",
};

const inline =
  "mx-1 inline-block rounded-md bg-primary px-2 py-0.5 align-baseline text-sm font-semibold text-brand-secondary shadow-xs ring-1 ring-primary ring-inset outline-none focus:ring-2 focus:ring-brand";

function NumberField({
  value,
  limit,
  label,
  onChange,
}: {
  value: number;
  limit: readonly [number, number];
  label: string;
  onChange: (n: number) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      aria-label={label}
      min={limit[0]}
      max={limit[1]}
      value={value}
      onChange={(e) => {
        const n = Math.round(Number(e.target.value));
        if (Number.isFinite(n)) onChange(Math.min(limit[1], Math.max(limit[0], n)));
      }}
      className={cx(inline, "w-16 text-center tabular-nums")}
    />
  );
}

function SaveButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={!dirty || pending}>
      {pending ? "Guardando…" : "Guardar cambios"}
    </Button>
  );
}

export function AlertRulesEditor({
  initial,
  data,
  action,
}: {
  initial: AlertRule[];
  data: AlertData;
  action: (form: FormData) => void | Promise<void>;
}) {
  const [rules, setRules] = useState(initial);
  const [selectedId, setSelectedId] = useState<AlertRule["id"]>(initial[0]?.id ?? "high_fill");
  const dirty = JSON.stringify(rules) !== JSON.stringify(initial);
  const evals = useMemo(() => rules.map((r) => evaluateRule(r, data)), [rules, data]);
  const index = Math.max(
    0,
    rules.findIndex((r) => r.id === selectedId),
  );
  const rule = rules[index];
  const ev = evals[index];

  const update = (patch: Partial<AlertRule>) =>
    setRules((all) => all.map((r, i) => (i === index ? ({ ...r, ...patch } as AlertRule) : r)));
  const toggle = (i: number) =>
    setRules((all) => all.map((r, j) => (j === i ? { ...r, enabled: !r.enabled } : r)));

  const actionSelect = (
    <select
      aria-label="Qué hacer"
      value={rule.action}
      onChange={(e) => update({ action: e.target.value as AlertAction })}
      className={cx(inline, "pr-7")}
    >
      {(Object.keys(ACTION_LABELS) as AlertAction[]).map((a) => (
        <option key={a} value={a}>
          {ACTION_LABELS[a]}
        </option>
      ))}
    </select>
  );

  let sentence: ReactNode;
  switch (rule.id) {
    case "high_fill":
      sentence = (
        <>
          Cuando una salida pase del
          <NumberField
            label="Porcentaje de ocupación"
            value={rule.percent}
            limit={LIMITS.percent}
            onChange={(percent) => update({ percent })}
          />
          % de ocupación,{actionSelect}.
        </>
      );
      break;
    case "low_fill":
      sentence = (
        <>
          Cuando a una salida le queden
          <NumberField
            label="Días antes de la salida"
            value={rule.days}
            limit={LIMITS.days}
            onChange={(days) => update({ days })}
          />
          días o menos y tenga menos del
          <NumberField
            label="Porcentaje vendido"
            value={rule.percent}
            limit={LIMITS.percent}
            onChange={(percent) => update({ percent })}
          />
          % vendido,{actionSelect}.
        </>
      );
      break;
    case "unanswered_requests":
      sentence = (
        <>
          Cuando una solicitud de presupuesto lleve más de
          <NumberField
            label="Horas sin responder"
            value={rule.hours}
            limit={LIMITS.hours}
            onChange={(hours) => update({ hours })}
          />
          h sin responder,{actionSelect}.
        </>
      );
      break;
    case "abandoned":
      sentence = (
        <>
          Cuando haya más de
          <NumberField
            label="Reservas sin pagar al día"
            value={rule.count}
            limit={LIMITS.count}
            onChange={(count) => update({ count })}
          />
          reservas sin pagar en un día,{actionSelect}.
        </>
      );
      break;
  }

  const peak = Math.max(...ev.series.map((s) => s.value), 0);
  const scale = ev.unit === "%" ? 100 : Math.max(peak, Math.ceil(ev.threshold * 1.5), 1);
  const line = Math.min(100, (ev.threshold / scale) * 100);
  const count = headline(rule, ev);

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="rules" value={JSON.stringify(rules)} />

      <section
        aria-label="Avisos"
        className="overflow-hidden rounded-xl bg-primary ring-1 ring-secondary"
      >
        <div className="border-b border-secondary px-4 py-4 md:px-5">
          <h2 className="text-md font-semibold tracking-tight text-primary">Tus avisos</h2>
          <p className="mt-0.5 text-sm text-tertiary">
            Actívalos o desactívalos. Pulsa uno para cambiar sus números.
          </p>
        </div>
        <ul className="divide-y divide-secondary">
          {rules.map((r, i) => {
            const n = headline(r, evals[i]);
            const active = r.id === rule.id;
            return (
              <li
                key={r.id}
                className={cx(
                  "flex items-start gap-3 px-4 py-4 md:items-center md:px-5",
                  active && "bg-secondary",
                )}
              >
                <span className="relative mt-0.5 inline-flex h-5 w-9 shrink-0 md:mt-0">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label={`Activar: ${TITLES[r.id]}`}
                    checked={r.enabled}
                    onChange={() => toggle(i)}
                    className="peer h-5 w-9 cursor-pointer appearance-none rounded-full bg-tertiary transition-colors duration-150 checked:bg-brand-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-150 peer-checked:translate-x-4"
                  />
                </span>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedId(r.id)}
                  className="flex min-w-0 flex-1 flex-col gap-1 text-left outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2 md:flex-row md:items-center md:justify-between md:gap-4"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-primary">{TITLES[r.id]}</span>
                    <span
                      className={cx(
                        "block text-sm",
                        r.enabled ? "text-tertiary" : "text-quaternary",
                      )}
                    >
                      {ruleSentence(r)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-tertiary md:text-right">
                    {r.enabled ? "Habría saltado" : "Desactivado · habría saltado"}{" "}
                    <span className="font-semibold text-primary tabular-nums">{n}</span>{" "}
                    {n === 1 ? "vez" : "veces"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        aria-label="Editar este aviso"
        className="overflow-hidden rounded-xl bg-primary ring-1 ring-secondary"
      >
        <div className="border-b border-secondary px-4 py-4 md:px-5">
          <h2 className="text-md font-semibold tracking-tight text-primary">Editar este aviso</h2>
          <p className="mt-0.5 text-sm text-tertiary">{TITLES[rule.id]}</p>
        </div>
        <div className="flex flex-col gap-6 px-4 py-5 md:px-5">
          <p className="text-md leading-9 text-secondary">{sentence}</p>

          <div className="rounded-lg bg-secondary p-4 ring-1 ring-secondary ring-inset">
            <p className="text-sm text-tertiary">Con los datos de hoy habría saltado</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-display-xs font-semibold text-primary tabular-nums">
                {count}
              </span>
              <span className="text-sm text-tertiary">
                {count === 1 ? "vez" : "veces"} · {count} {ev.summary}
              </span>
            </p>

            {ev.series.length ? (
              <div className="mt-4">
                <div
                  role="img"
                  aria-label={`${ev.caption} Línea en ${ev.threshold}${ev.unit ? ` ${ev.unit}` : ""}. ${ev.series.filter((s) => s.over).length} de ${ev.series.length} por encima.`}
                  className="relative flex h-36 items-end gap-1 border-b border-secondary"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-fg-error-secondary"
                    style={{ bottom: `${line}%` }}
                  >
                    <span className="absolute -top-5 right-0 rounded bg-primary px-1 text-xs font-medium text-error-primary">
                      {ev.threshold}
                      {ev.unit && ` ${ev.unit}`}
                    </span>
                  </span>
                  {ev.series.map((s, i) => (
                    <span
                      key={i}
                      title={`${s.label}: ${s.value}${ev.unit ? ` ${ev.unit}` : ""}`}
                      className={cx(
                        "min-w-0 flex-1 rounded-t-sm",
                        s.over ? "bg-brand-solid" : "bg-quaternary",
                      )}
                      style={{ height: `${Math.max(2, Math.min(100, (s.value / scale) * 100))}%` }}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-xs text-quaternary">
                  <span>{ev.series[0].label}</span>
                  <span>{ev.series.at(-1)!.label}</span>
                </div>
              </div>
            ) : (
              <p className="mt-4 py-6 text-center text-sm text-tertiary">
                No hay datos para este aviso ahora mismo.
              </p>
            )}
            <p className="mt-3 text-xs leading-5 text-tertiary">{ev.caption}</p>
          </div>

          {ev.hits.length > 0 && (
            <div>
              <p className="text-sm font-medium text-secondary">Ahora mismo</p>
              <ul className="mt-2 divide-y divide-secondary rounded-lg ring-1 ring-secondary">
                {ev.hits.slice(0, 8).map((h) => (
                  <li key={h.key}>
                    <Link
                      href={h.href}
                      className="block px-3 py-2.5 text-sm text-secondary outline-focus-ring hover:bg-primary_hover focus-visible:outline-2"
                    >
                      {h.text}
                    </Link>
                  </li>
                ))}
              </ul>
              {ev.hits.length > 8 && (
                <p className="mt-2 text-xs text-tertiary">Y {ev.hits.length - 8} más.</p>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 border-t border-secondary bg-secondary px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <span role="status" className="text-sm text-tertiary">
            {dirty ? "Tienes cambios sin guardar." : "Sin cambios."}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!dirty} onClick={() => setRules(initial)}>
              Descartar
            </Button>
            <SaveButton dirty={dirty} />
          </div>
        </div>
      </section>
    </form>
  );
}
