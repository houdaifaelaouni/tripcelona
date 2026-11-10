"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { iconButtonClasses } from "@/components/ui/icon-button";

/**
 * Modal dialog on the native <dialog> element: focus trapping, Escape to close
 * and inert background come from showModal().
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="dialog-title"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-panel p-0 shadow-panel backdrop:bg-ink/50"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 id="dialog-title" className="text-base font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className={iconButtonClasses("soft", "sm")}
          aria-label="Cerrar"
        >
          <X aria-hidden size={16} />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </dialog>
  );
}
