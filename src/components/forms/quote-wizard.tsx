"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { submitQuote } from "@/lib/forms/actions";
import { QUOTE_CUSTOM, type FormState } from "@/lib/forms/schema";
import { useT } from "@/components/i18n/provider";
import { FormAlert, FormSuccess, Honeypot, PrivacyConsent } from "./form-bits";

type TourOption = { slug: string; title: string; priceFrom: string | null };
type Values = Record<string, string | string[]>;

const STORAGE_KEY = "tripcelona:crea-tu-tour:v1";
const STEPS = ["Elige tu plan base", "Fecha y grupo", "Añade extras", "Tus datos"] as const;
/** Which fields live on which step (for jumping to the first server error). */
const STEP_FIELDS: string[][] = [
  ["tour"],
  ["dates", "groupSize"],
  ["extras", "budget"],
  ["name", "email", "phone", "company", "message", "privacy"],
];

function load(): Values {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Values;
  } catch {
    return {};
  }
}

/**
 * FR-40: multi-step quote request. Without JavaScript every step shows at
 * once and the form still submits; with it, one step at a time, validated
 * per step, with progress kept in this browser until it is sent.
 */
export function QuoteWizard({
  tours,
  extras,
  groupNote,
  initialTour,
}: {
  tours: TourOption[];
  extras: string[];
  groupNote: string | null;
  initialTour?: string;
}) {
  const t = useT();
  const tr = (s?: string) => (s ? t(s) : undefined);
  const [state, action, pending] = useActionState<FormState, FormData>(submitQuote, {
    status: "idle",
  });
  const [enhanced, setEnhanced] = useState(false);
  const [step, setStep] = useState(0);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [restored, setRestored] = useState<Values>({});
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLLegendElement>(null);

  // Hydrated: switch to one-step-at-a-time and restore saved progress.
  useEffect(() => {
    const saved = load();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser-only storage after hydration
    setRestored(initialTour && !saved.tour ? { ...saved, tour: initialTour } : saved);
    setEnhanced(true);
  }, [initialTour]);

  const serverErrors = state.status === "error" ? state.fieldErrors : {};
  const errors = { ...serverErrors, ...stepErrors };
  const values: Values = state.status === "error" ? state.values : restored;
  const v = (k: string) => {
    const x = values[k];
    return typeof x === "string" ? x : "";
  };
  const chosenExtras = Array.isArray(values.extras) ? values.extras : [];

  // After a server error, show the first step that has one.
  useEffect(() => {
    if (state.status !== "error") return;
    const first = STEP_FIELDS.findIndex((fields) => fields.some((f) => state.fieldErrors[f]));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to the action result
    if (first >= 0) setStep(first);
  }, [state]);

  useEffect(() => {
    if (state.status === "ok") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* storage unavailable */
      }
    }
  }, [state.status]);

  function save() {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const out: Values = { extras: data.getAll("extras").map(String) };
    for (const k of [
      "tour",
      "dates",
      "groupSize",
      "budget",
      "name",
      "email",
      "phone",
      "company",
      "message",
    ]) {
      out[k] = String(data.get(k) ?? "");
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch {
      /* storage unavailable: progress just isn't kept */
    }
  }

  function validateStep(i: number): boolean {
    const form = formRef.current!;
    const data = new FormData(form);
    const errs: Record<string, string> = {};
    const val = (k: string) => String(data.get(k) ?? "").trim();
    if (i === 0 && !val("tour")) errs.tour = "Elige una excursión o «destino a medida».";
    if (i === 1) {
      if (!val("dates")) errs.dates = "Indica una fecha o un periodo.";
      const n = Number(val("groupSize"));
      if (!Number.isInteger(n) || n < 1) errs.groupSize = "Número de personas no válido.";
    }
    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function go(next: number) {
    if (next > step && !validateStep(step)) return;
    setStepErrors({});
    save();
    setStep(next);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  if (state.status === "ok") {
    return (
      <FormSuccess title={t("Solicitud enviada")}>
        <p>{t("Gracias. Te enviaremos una propuesta personalizada en 24–48 horas.")}</p>
      </FormSuccess>
    );
  }

  const shown = (i: number) => !enhanced || i === step;

  return (
    <form
      ref={formRef}
      action={action}
      onInput={save}
      onChange={save}
      noValidate
      className="relative space-y-6"
    >
      <Honeypot />
      {enhanced && (
        <div>
          <p className="text-sm text-tertiary">
            {t("Paso {n} de {total}", { n: step + 1, total: STEPS.length })}
          </p>
          <ol className="mt-2 grid grid-cols-4 gap-2" aria-label={t("Pasos")}>
            {STEPS.map((label, i) => (
              <li key={label} aria-current={i === step ? "step" : undefined} className="min-w-0">
                <span
                  aria-hidden
                  className={cn(
                    "block h-1 rounded-full transition-colors motion-reduce:transition-none",
                    i <= step ? "bg-ink" : "bg-border",
                  )}
                />
                <span
                  className={cn(
                    "mt-2 hidden truncate text-caption sm:block",
                    i === step ? "font-semibold text-primary" : "text-tertiary",
                  )}
                >
                  {t(label)}
                </span>
                <span className="sr-only sm:hidden">
                  {i + 1}. {t(label)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {state.status === "error" && <FormAlert message={state.message} />}

      {/* key forces defaultValue to apply once saved progress is restored */}
      <div key={enhanced ? "enhanced" : "static"} className="space-y-6">
        <fieldset className={cn("space-y-4", !shown(0) && "hidden")}>
          <legend
            ref={step === 0 ? headingRef : undefined}
            tabIndex={-1}
            className="text-display-sm font-semibold"
          >
            1. {t(STEPS[0])}
          </legend>
          <Select
            label={t("Excursión")}
            name="tour"
            required
            defaultValue={v("tour")}
            error={tr(errors.tour)}
          >
            <option value="">{t("Selecciona una excursión…")}</option>
            {tours.map((tour) => (
              <option key={tour.slug} value={tour.slug}>
                {tour.title}
                {tour.priceFrom ? ` — ${t("desde {price}", { price: tour.priceFrom })}` : ""}
              </option>
            ))}
            <option value={QUOTE_CUSTOM}>{t("Destino a medida (cuéntanos tu idea)")}</option>
          </Select>
        </fieldset>

        <fieldset className={cn("space-y-4", !shown(1) && "hidden")}>
          <legend
            ref={step === 1 ? headingRef : undefined}
            tabIndex={-1}
            className="text-display-sm font-semibold"
          >
            2. {t(STEPS[1])}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t("Fecha preferida")}
              name="dates"
              required
              defaultValue={v("dates")}
              error={tr(errors.dates)}
              hint={t("Una fecha concreta o varias opciones.")}
            />
            <Input
              label={t("Número de personas")}
              name="groupSize"
              type="number"
              inputMode="numeric"
              min={1}
              required
              defaultValue={v("groupSize")}
              error={tr(errors.groupSize)}
            />
          </div>
          {groupNote && <p className="text-tertiary">{t(groupNote)}</p>}
        </fieldset>

        <fieldset className={cn("space-y-4", !shown(2) && "hidden")}>
          <legend
            ref={step === 2 ? headingRef : undefined}
            tabIndex={-1}
            className="text-display-sm font-semibold"
          >
            3. {t(STEPS[2])}
          </legend>
          {extras.length > 0 && (
            <ul className="space-y-3">
              {extras.map((x) => (
                <li key={x}>
                  <Checkbox
                    name="extras"
                    value={x}
                    label={t(x)}
                    defaultChecked={chosenExtras.includes(x)}
                  />
                </li>
              ))}
            </ul>
          )}
          <Input
            label={t("Presupuesto aproximado (opcional)")}
            name="budget"
            defaultValue={v("budget")}
            error={tr(errors.budget)}
            hint={t("Por persona o para todo el grupo.")}
          />
        </fieldset>

        <fieldset className={cn("space-y-4", !shown(3) && "hidden")}>
          <legend
            ref={step === 3 ? headingRef : undefined}
            tabIndex={-1}
            className="text-display-sm font-semibold"
          >
            4. {t(STEPS[3])}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t("Nombre")}
              name="name"
              autoComplete="name"
              required
              defaultValue={v("name")}
              error={tr(errors.name)}
            />
            <Input
              label={t("Email")}
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={v("email")}
              error={tr(errors.email)}
            />
            <Input
              label={t("Teléfono / WhatsApp")}
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              defaultValue={v("phone")}
              error={tr(errors.phone)}
            />
            <Input
              label={t("Empresa o grupo (opcional)")}
              name="company"
              autoComplete="organization"
              defaultValue={v("company")}
              error={tr(errors.company)}
            />
          </div>
          <Textarea
            label={t("¿Algo más que debamos saber?")}
            name="message"
            rows={4}
            defaultValue={v("message")}
            error={tr(errors.message)}
          />
          <PrivacyConsent error={tr(errors.privacy)} />
          <p className="text-sm text-tertiary">
            {t("Te confirmaremos el precio final sin compromiso.")}
          </p>
        </fieldset>
      </div>

      <div className="flex flex-wrap gap-3">
        {enhanced && step > 0 && (
          <Button variant="outline" onClick={() => go(step - 1)}>
            {t("Atrás")}
          </Button>
        )}
        {enhanced && step < STEPS.length - 1 ? (
          // Distinct keys: reusing one <button> would turn the click into a submit.
          <Button key="next" onClick={() => go(step + 1)}>
            {t("Siguiente")}
          </Button>
        ) : (
          <Button key="submit" type="submit" size="lg" disabled={pending}>
            {pending ? t("Enviando…") : t("Solicitar presupuesto")}
          </Button>
        )}
      </div>
    </form>
  );
}
