/*
 * Form fields. Label/hint/error structure adapted from Opensource UI
 * `text-field-input`, `textarea-field-input`, `select-field-input`,
 * `checkbox-field-input`, `radio-group-field-input` and `switch-field-input`
 * (MIT, © 2026 Bidyut Kundu, https://opensourceui.in), re-tokened to the
 * Tripcelona palette. Native inputs are kept so fields work in server-action
 * forms and without JavaScript. See THIRD_PARTY_NOTICES.md.
 */
import { Check } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** 56px control, 8px corners, hairline border that turns 2px ink on focus. */
// Untitled UI input style (MIT, see THIRD_PARTY_NOTICES.md).
export const controlClasses = cn(
  "h-12 w-full rounded-lg bg-primary px-3.5 text-md text-primary shadow-xs ring-1 ring-primary ring-inset outline-none",
  "transition-shadow duration-100 ease-linear motion-reduce:transition-none",
  "placeholder:text-placeholder",
  "focus:ring-2 focus:ring-brand",
  "disabled:cursor-not-allowed disabled:bg-secondary disabled:text-quaternary",
  "aria-invalid:ring-error_subtle aria-invalid:focus:ring-2 aria-invalid:focus:ring-error",
);

type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  hideLabel?: boolean;
};

function RequiredMark({ show }: { show?: boolean }) {
  if (!show) return null;
  return (
    <span className="ml-0.5 text-error-primary" aria-hidden>
      *
    </span>
  );
}

function Message({ id, hint, error }: { id: string; hint?: ReactNode; error?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} className="text-sm text-error-primary" role="alert">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="text-sm text-tertiary">
        {hint}
      </p>
    );
  }
  return null;
}

function FieldShell({
  id,
  label,
  hint,
  error,
  hideLabel,
  required,
  children,
}: FieldProps & { id: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={cn("text-sm font-medium text-secondary", hideLabel && "sr-only")}
      >
        {label}
        <RequiredMark show={required} />
      </label>
      {children}
      <Message id={id} hint={hint} error={error} />
    </div>
  );
}

function describedBy(id: string, hint?: ReactNode, error?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export function Input({
  label,
  hint,
  error,
  hideLabel,
  id,
  className,
  required,
  ...props
}: FieldProps & ComponentProps<"input">) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      required={required}
    >
      <input
        id={fieldId}
        required={required}
        className={cn(controlClasses, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        {...props}
      />
    </FieldShell>
  );
}

export function Select({
  label,
  hint,
  error,
  hideLabel,
  id,
  className,
  required,
  children,
  ...props
}: FieldProps & ComponentProps<"select">) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      required={required}
    >
      <select
        id={fieldId}
        required={required}
        className={cn(controlClasses, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function Textarea({
  label,
  hint,
  error,
  hideLabel,
  id,
  className,
  required,
  ...props
}: FieldProps & ComponentProps<"textarea">) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      required={required}
    >
      <textarea
        id={fieldId}
        required={required}
        className={cn(controlClasses, "h-auto min-h-28 py-3", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        {...props}
      />
    </FieldShell>
  );
}

type ChoiceProps = Omit<ComponentProps<"input">, "type"> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
};

/** Native checkbox with a custom box; the tick shows via CSS (no JS state). */
export function Checkbox({ label, hint, error, id, className, required, ...props }: ChoiceProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={fieldId}
        className="flex cursor-pointer items-start gap-3 has-disabled:cursor-not-allowed has-disabled:opacity-60"
      >
        <span className="relative mt-0.5 flex size-5 shrink-0">
          <input
            id={fieldId}
            type="checkbox"
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(fieldId, hint, error)}
            className={cn(
              "peer size-5 cursor-pointer appearance-none rounded-[6px] border border-primary bg-white",
              "transition-[background-color,border-color] duration-150 motion-reduce:transition-none",
              "checked:border-brand-solid checked:bg-brand-solid hover:border-brand",
              "aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-secondary",
              className,
            )}
            {...props}
          />
          <Check
            size={14}
            strokeWidth={3}
            aria-hidden
            className="pointer-events-none absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100"
          />
        </span>
        <span className="min-w-0 text-base text-primary">
          {label}
          <RequiredMark show={required} />
        </span>
      </label>
      <Message id={fieldId} hint={hint} error={error} />
    </div>
  );
}

/** Native radio with a custom dot. Group several inside <RadioGroup>. */
export function Radio({ label, hint, id, className, ...props }: Omit<ChoiceProps, "error">) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <label
      htmlFor={fieldId}
      className="flex cursor-pointer items-start gap-3 has-disabled:cursor-not-allowed has-disabled:opacity-60"
    >
      <input
        id={fieldId}
        type="radio"
        aria-describedby={hint ? `${fieldId}-hint` : undefined}
        className={cn(
          "mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-full border border-primary bg-white",
          "transition-[border-width,border-color] duration-150 motion-reduce:transition-none",
          "checked:border-[6px] checked:border-brand-solid hover:border-brand disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />
      <span className="min-w-0">
        <span className="block text-base text-primary">{label}</span>
        {hint && (
          <span id={`${fieldId}-hint`} className="block text-sm text-tertiary">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}

export function RadioGroup({
  legend,
  hideLegend,
  error,
  required,
  className,
  children,
}: {
  legend: string;
  hideLegend?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <fieldset
      className={cn("flex flex-col gap-3", className)}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
    >
      <legend className={cn("mb-1 text-sm font-medium text-primary", hideLegend && "sr-only")}>
        {legend}
        <RequiredMark show={required} />
      </legend>
      {children}
      <Message id={id} error={error} />
    </fieldset>
  );
}

/**
 * On/off switch. A native checkbox with role="switch", so it submits with the
 * form and needs no client JavaScript.
 */
export function Switch({ label, hint, id, className, ...props }: Omit<ChoiceProps, "error">) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <label
      htmlFor={fieldId}
      className="flex cursor-pointer items-start justify-between gap-4 has-disabled:cursor-not-allowed has-disabled:opacity-60"
    >
      <span className="min-w-0">
        <span className="block text-base font-medium text-primary">{label}</span>
        {hint && (
          <span id={`${fieldId}-hint`} className="mt-0.5 block text-sm text-tertiary">
            {hint}
          </span>
        )}
      </span>
      <span className="relative inline-flex h-7 w-12 shrink-0">
        <input
          id={fieldId}
          type="checkbox"
          role="switch"
          aria-describedby={hint ? `${fieldId}-hint` : undefined}
          className={cn(
            "peer h-7 w-12 cursor-pointer appearance-none rounded-full border-2 border-primary bg-border",
            "transition-[background-color,border-color] duration-200 motion-reduce:transition-none",
            "checked:border-brand-solid checked:bg-brand-solid disabled:cursor-not-allowed",
            className,
          )}
          {...props}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1 left-1 size-5 rounded-full bg-white shadow-lg transition-transform duration-200 peer-checked:translate-x-5 motion-reduce:transition-none"
        />
      </span>
    </label>
  );
}
