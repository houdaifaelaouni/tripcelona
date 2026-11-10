import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "h-10 w-full rounded-control border border-border-strong bg-white px-3 text-base text-ink placeholder:text-muted hover:border-blue disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-muted aria-invalid:border-danger";

type FieldProps = { label: string; hint?: ReactNode; error?: string; hideLabel?: boolean };

function FieldShell({
  id,
  label,
  hint,
  error,
  hideLabel,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={cn("text-sm font-bold", hideLabel && "sr-only")}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
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
  ...props
}: FieldProps & ComponentProps<"input">) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <input
        id={fieldId}
        className={cn(control, className)}
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
  children,
  ...props
}: FieldProps & ComponentProps<"select">) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <select
        id={fieldId}
        className={cn(control, "appearance-auto pr-8", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}
