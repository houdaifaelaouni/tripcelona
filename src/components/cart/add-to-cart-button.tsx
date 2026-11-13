"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { addToCart } from "@/lib/cart/store";

export function AddToCartButton({
  departureId,
  travellers,
}: {
  departureId: string;
  travellers: number;
}) {
  const [result, setResult] = useState<"added" | "full" | null>(null);
  return (
    <div className="mt-2">
      <button
        type="button"
        className={buttonClasses({ size: "lg", variant: "outline" }, "w-full")}
        onClick={() => setResult(addToCart(departureId, travellers))}
      >
        Añadir al carrito
      </button>
      <p className="mt-2 text-sm" role="status" aria-live="polite">
        {result === "added" && (
          <span className="text-tertiary">
            Añadido.{" "}
            <Link
              href="/carrito"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Ver carrito
            </Link>
          </span>
        )}
        {result === "full" && (
          <span className="text-error-primary">
            El carrito admite hasta 6 excursiones distintas. Paga o quita alguna primero.
          </span>
        )}
      </p>
    </div>
  );
}
