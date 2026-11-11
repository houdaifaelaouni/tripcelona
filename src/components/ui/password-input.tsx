"use client";

/*
 * Password field with a show/hide toggle, adapted from Opensource UI
 * `password-field-input` (MIT, © 2026 Bidyut Kundu; see THIRD_PARTY_NOTICES.md).
 */
import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";
import { controlClasses } from "@/components/ui/field";
import { cn } from "@/lib/cn";

export function PasswordInput({
  label,
  id,
  className,
  required,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: string }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [shown, setShown] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-primary">
        {label}
        {required && (
          <span className="ml-0.5 text-error-primary" aria-hidden>
            *
          </span>
        )}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type={shown ? "text" : "password"}
          required={required}
          className={cn(controlClasses, "pr-14", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={shown}
          className="absolute inset-y-0 right-1 my-auto flex size-12 items-center justify-center rounded-lg text-tertiary hover:text-primary"
        >
          {shown ? <EyeOff aria-hidden size={20} /> : <Eye aria-hidden size={20} />}
        </button>
      </div>
    </div>
  );
}
