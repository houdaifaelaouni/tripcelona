import Image from "next/image";
import { cn } from "@/lib/cn";
import logo from "../../../public/brand/tripcelona-logo.png";

/**
 * The owner's Tripcelona logo, used exactly as supplied (2026-11-13):
 * Sagrada Família, mountain, sun and boat over the TRIPCELONA wordmark.
 * Size it with a height class; the width follows the artwork.
 */
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src={logo}
      alt="Tripcelona"
      priority={priority}
      sizes="160px"
      className={cn("h-11 w-auto", className)}
    />
  );
}
