"use client";

/*
 * Quantity stepper adapted from Opensource UI `quantity-stepper-button`
 * (MIT, © 2026 Bidyut Kundu, https://opensourceui.in): flattened to the
 * design rules (outline circles), Spanish labels, and a hidden input so the
 * value submits with the form. See THIRD_PARTY_NOTICES.md.
 */
import { Minus, Plus } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/components/i18n/provider";
import { iconButtonClasses } from "@/components/ui/icon-button";

export function QuantityStepper({
  label,
  hint,
  name,
  value,
  defaultValue = 1,
  min = 0,
  max = 99,
  onChange,
  className,
}: {
  label: string;
  hint?: string;
  name?: string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
  className?: string;
}) {
  const id = useId();
  const t = useT();
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;

  const update = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next));
    if (value === undefined) setInternal(clamped);
    onChange?.(clamped);
  };

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-base font-medium text-primary">
          {label}
        </p>
        {hint && <p className="text-sm text-tertiary">{hint}</p>}
      </div>
      <div role="group" aria-labelledby={`${id}-label`} className="flex items-center gap-3">
        <button
          type="button"
          aria-label={t("Quitar uno ({label})", { label })}
          disabled={current <= min}
          onClick={() => update(current - 1)}
          className={iconButtonClasses("outline", "sm", "disabled:opacity-30")}
        >
          <Minus size={14} strokeWidth={2.5} aria-hidden />
        </button>
        <output aria-live="polite" className="min-w-6 text-center text-base tabular-nums">
          {current}
        </output>
        <button
          type="button"
          aria-label={t("Añadir uno ({label})", { label })}
          disabled={current >= max}
          onClick={() => update(current + 1)}
          className={iconButtonClasses("outline", "sm", "disabled:opacity-30")}
        >
          <Plus size={14} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
      {name && <input type="hidden" name={name} value={current} />}
    </div>
  );
}
