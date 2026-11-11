"use client";

/** Password field with show/hide, in the admin (Untitled UI) input style. */
import { Eye, EyeOff } from "@untitledui/icons";
import { useId, useState, type ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { adminControl } from "./fields";

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
      <label htmlFor={fieldId} className="text-sm font-medium text-secondary">
        {label}
        {required && (
          <span className="ml-0.5 text-brand-tertiary" aria-hidden>
            *
          </span>
        )}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type={shown ? "text" : "password"}
          required={required}
          className={cn(adminControl, "h-11 pr-12", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={shown}
          className="absolute inset-y-0 right-1 my-auto flex size-9 items-center justify-center rounded-md text-fg-quaternary hover:text-fg-quaternary_hover"
        >
          {shown ? (
            <EyeOff aria-hidden className="size-5" />
          ) : (
            <Eye aria-hidden className="size-5" />
          )}
        </button>
      </div>
    </div>
  );
}
