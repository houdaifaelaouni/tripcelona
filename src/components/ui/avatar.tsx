"use client";

/** shadcn-style Avatar: an image with a fallback (usually initials) underneath. */
import { useState, type ReactNode } from "react";
import { cx } from "@/components/uui/utils/cx";

export function Avatar({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cx(
        "relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function AvatarImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote avatars
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={cx("absolute inset-0 z-10 size-full object-cover", className)}
    />
  );
}

export function AvatarFallback({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "flex size-full items-center justify-center bg-brand-solid text-xs font-semibold text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}
