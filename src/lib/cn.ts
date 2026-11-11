import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/*
 * tailwind-merge must know our custom theme keys, otherwise it treats
 * `text-meta` (a size) and `text-ink` (a colour) as the same group and drops
 * one of them.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["meta", "caption", "badge", "display-sm", "display-md", "display-lg", "display-xl"],
      radius: ["control", "card", "panel", "strip"],
      shadow: ["float"],
      color: [
        "navy",
        "navy-dark",
        "yellow",
        "blue",
        "blue-dark",
        "ink",
        "muted",
        "border",
        "border-strong",
        "surface",
        "surface-alt",
        "danger",
        "success",
        "whatsapp",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
