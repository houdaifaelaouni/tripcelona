"use client";

import Link from "@/components/i18n/link";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { addToCart } from "@/lib/cart/store";
import { track } from "@/lib/tracking/client";
import { useT } from "@/components/i18n/provider";

export function AddToCartButton({
  departureId,
  travellers,
  item,
}: {
  departureId: string;
  travellers: number;
  item?: { slug: string; title: string; priceCents: number };
}) {
  const t = useT();
  const [result, setResult] = useState<"added" | "full" | null>(null);
  return (
    <div className="mt-2">
      <button
        type="button"
        className={buttonClasses({ size: "lg", variant: "outline" }, "w-full")}
        onClick={() => {
          const r = addToCart(departureId, travellers);
          setResult(r);
          if (r === "added" && item)
            track("AddToCart", {
              items: [
                {
                  id: item.slug,
                  name: item.title,
                  priceCents: item.priceCents,
                  quantity: travellers,
                },
              ],
            });
        }}
      >
        {t("Añadir al carrito")}
      </button>
      <p className="mt-2 text-sm" role="status" aria-live="polite">
        {result === "added" && (
          <span className="text-tertiary">
            {t("Añadido.")}{" "}
            <Link
              href="/carrito"
              className="font-semibold text-primary underline underline-offset-2"
            >
              {t("Ver carrito")}
            </Link>
          </span>
        )}
        {result === "full" && (
          <span className="text-error-primary">
            {t("El carrito admite hasta 6 excursiones distintas. Paga o quita alguna primero.")}
          </span>
        )}
      </p>
    </div>
  );
}
