"use client";

import { useState } from "react";

/** Copies a value to the clipboard and says so for a moment. */
export function CopyButton({ value, label = "Copiar" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          // Clipboard blocked: the link is visible to copy by hand.
        }
      }}
      className="rounded-lg px-3 py-2 text-sm font-semibold text-secondary ring-1 ring-primary ring-inset hover:bg-primary_hover"
    >
      {done ? "¡Copiado!" : label}
    </button>
  );
}
