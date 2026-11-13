"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ShoppingCart } from "lucide-react";
import Link from "@/components/i18n/link";
import { iconButtonClasses } from "@/components/ui/icon-button";
import { useRef } from "react";
import { useCart } from "@/lib/cart/store";
import { useT } from "@/components/i18n/provider";

export function CartLink() {
  const t = useT();
  const count = useCart().length;
  const badge = useRef<HTMLSpanElement>(null);
  const previous = useRef(count);
  // The badge pops when something is added.
  useGSAP(
    () => {
      const grew = count > previous.current;
      previous.current = count;
      if (!grew || !badge.current) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          badge.current,
          { scale: 0.4 },
          { scale: 1, duration: 0.5, ease: "back.out(3)", clearProps: "transform" },
        );
      });
    },
    { dependencies: [count] },
  );
  return (
    <Link
      href="/carrito"
      aria-label={
        count > 0
          ? count === 1
            ? t("Carrito, 1 excursión")
            : t("Carrito, {n} excursiones", { n: count })
          : t("Carrito")
      }
      className={iconButtonClasses(
        "soft",
        "md",
        "relative size-9 rounded-lg bg-primary text-fg-tertiary ring-1 ring-secondary ring-inset hover:bg-secondary hover:text-fg-primary",
      )}
    >
      <ShoppingCart size={18} aria-hidden />
      {count > 0 && (
        <span
          ref={badge}
          aria-hidden
          className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-brand-solid text-[11px] font-semibold text-white"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
