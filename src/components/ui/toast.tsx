"use client";

/*
 * Toast adapted from Opensource UI (MIT, © 2026 Bidyut Kundu; see
 * THIRD_PARTY_NOTICES.md). It does not hide itself on a timer (WCAG 2.2.1):
 * the person dismisses it, or it goes when they navigate.
 */
import { CircleCheck, X } from "lucide-react";
import { useState } from "react";
import { iconButtonClasses } from "@/components/ui/icon-button";

export function Toast({ message }: { message: string }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-card bg-ink p-4 text-white shadow-float sm:right-6 sm:bottom-6 sm:left-auto sm:mx-0"
    >
      <CircleCheck aria-hidden size={20} className="mt-0.5 shrink-0 text-[#7ee2a8]" />
      <p className="flex-1 text-meta">{message}</p>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Cerrar aviso"
        className={iconButtonClasses(
          "soft",
          "sm",
          "-my-1 bg-white/10 text-white hover:bg-white/20",
        )}
      >
        <X aria-hidden size={16} />
      </button>
    </div>
  );
}
