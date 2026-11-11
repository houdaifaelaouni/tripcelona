/**
 * Admin form fields in the Untitled UI input style (MIT, © 2025 Untitled UI,
 * https://github.com/untitleduico/react, components/base/input, select,
 * textarea and checkbox). Native controls, same API as
 * @/components/ui/field, so they work in server-action forms without JS.
 */
import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const adminControl = cn(
  "w-full rounded-lg bg-primary px-3.5 py-2.5 text-md text-primary shadow-xs ring-1 ring-primary ring-inset outline-none",
  "transition-shadow duration-100 ease-linear placeholder:text-placeholder",
  "focus:ring-2 focus:ring-brand",
  "disabled:cursor-not-allowed disabled:bg-secondary disabled:text-quaternary disabled:ring-secondary",
  "aria-invalid:ring-error_subtle aria-invalid:focus:ring-2 aria-invalid:focus:ring-error",
);

type FieldProps = { label: string; hint?: ReactNode; error?: string; hideLabel?: boolean };

function Required({ show }: { show?: boolean }) {
  return show ? (
    <span className="ml-0.5 text-brand-tertiary" aria-hidden>
      *
    </span>
  ) : null;
}

function Message({ id, hint, error }: { id: string; hint?: ReactNode; error?: string }) {
  if (error)
    return (
      <p id={`${id}-error`} className="text-sm text-error-primary" role="alert">
        {error}
      </p>
    );
  if (hint)
    return (
      <p id={`${id}-hint`} className="text-sm text-tertiary">
        {hint}
      </p>
    );
  return null;
}

function Shell({
  id,
  label,
  hint,
  error,
  hideLabel,
  required,
  className,
  children,
}: FieldProps & { id: string; required?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className={cn("text-sm font-medium text-secondary", hideLabel && "sr-only")}
      >
        {label}
        <Required show={required} />
      </label>
      {children}
      <Message id={id} hint={hint} error={error} />
    </div>
  );
}

const describedBy = (id: string, hint?: ReactNode, error?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

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
    <Shell {...{ id: fieldId, label, hint, error, hideLabel, required, className }}>
      <input
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={cn(adminControl, "h-11")}
        {...props}
      />
    </Shell>
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
    <Shell {...{ id: fieldId, label, hint, error, hideLabel, required, className }}>
      <select
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={cn(adminControl, "h-11 appearance-auto pr-8")}
        {...props}
      >
        {children}
      </select>
    </Shell>
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
    <Shell {...{ id: fieldId, label, hint, error, hideLabel, required, className }}>
      <textarea
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={cn(adminControl, "min-h-24 py-3")}
        {...props}
      />
    </Shell>
  );
}

type ChoiceProps = Omit<ComponentProps<"input">, "type"> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
};

/** Untitled UI checkbox: 16px box, brand fill and a white tick when checked. */
export function Checkbox({ label, hint, error, id, className, required, ...props }: ChoiceProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={fieldId}
        className="flex cursor-pointer items-start gap-3 has-disabled:cursor-not-allowed has-disabled:opacity-60"
      >
        <span className="relative mt-0.5 flex size-4 shrink-0">
          <input
            id={fieldId}
            type="checkbox"
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(fieldId, hint, error)}
            className={cn(
              "peer size-4 cursor-pointer appearance-none rounded bg-primary ring-1 ring-primary ring-inset",
              "checked:bg-brand-solid checked:ring-brand-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              "aria-invalid:ring-error",
              className,
            )}
            {...props}
          />
          <svg
            aria-hidden
            viewBox="0 0 14 14"
            fill="none"
            className="pointer-events-none absolute inset-0 m-auto size-3 text-white opacity-0 peer-checked:opacity-100"
          >
            <path
              d="M11.667 3.5 5.25 9.917 2.333 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="min-w-0 text-sm font-medium text-secondary">
          {label}
          <Required show={required} />
        </span>
      </label>
      <Message id={fieldId} hint={hint} error={error} />
    </div>
  );
}

/** Untitled UI toggle (36×20, brand when on). A native checkbox with role="switch". */
export function Switch({ label, hint, id, className, ...props }: Omit<ChoiceProps, "error">) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <label
      htmlFor={fieldId}
      className="flex cursor-pointer items-start gap-3 has-disabled:cursor-not-allowed has-disabled:opacity-60"
    >
      <span className="relative mt-0.5 inline-flex h-5 w-9 shrink-0">
        <input
          id={fieldId}
          type="checkbox"
          role="switch"
          aria-describedby={hint ? `${fieldId}-hint` : undefined}
          className={cn(
            "peer h-5 w-9 cursor-pointer appearance-none rounded-full bg-tertiary transition-colors duration-150",
            "checked:bg-brand-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            className,
          )}
          {...props}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-150 peer-checked:translate-x-4"
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-secondary">{label}</span>
        {hint && (
          <span id={`${fieldId}-hint`} className="block text-sm text-tertiary">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}
