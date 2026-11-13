import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Tripcelona mark (2026-11 redraw of the owner's logo): the Sagrada Família
 * spires, a Pyrenees peak and the sun, drawn as one white line on a blue
 * tile, with the senyera in the portal. Reads down to 16px.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  const clip = `tc-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("size-8 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="40" height="40" rx="10" fill="var(--color-brand-600)" />
      <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 31V16l2.5-7L13 16" />
        <path d="M13 31V13l2.5-7.5L18 13v18" />
        <path d="M18 16l2-5.5 2 5.5v15" />
        <path d="M22 31l6-10.5 2.6 4.4 2-2.9L37 31" />
        <circle cx="30.5" cy="10" r="2.6" />
        <path d="M5.5 31h30" />
      </g>
      <clipPath id={clip}>
        <path d="M13 31v-4.2a2.5 2.5 0 0 1 5 0V31z" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect x="12" y="23" width="7" height="9" fill="#fcdd09" />
        <path d="M14.25 23v9M15.5 23v9M16.75 23v9" stroke="#da121a" strokeWidth=".7" />
      </g>
    </svg>
  );
}

/** Mark + wordmark. `tone="light"` for dark backgrounds. */
export function Logo({
  className,
  markClassName,
  tone = "dark",
}: {
  className?: string;
  markClassName?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-lg font-semibold tracking-[-0.02em]",
        tone === "dark" ? "text-primary" : "text-white",
        className,
      )}
    >
      <LogoMark className={markClassName} />
      Tripcelona
    </span>
  );
}
