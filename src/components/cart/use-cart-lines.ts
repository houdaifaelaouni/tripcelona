"use client";

import { useEffect, useState } from "react";
import { loadCartLines, type CartLine } from "@/lib/cart/lines";
import { useCart } from "@/lib/cart/store";

/** The cart's lines with live price and availability from the server. */
export function useCartLines(): { lines: CartLine[]; loading: boolean; empty: boolean } {
  const items = useCart();
  const key = JSON.stringify(items);
  const [loaded, setLoaded] = useState<{ key: string; lines: CartLine[] } | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    loadCartLines(items).then((lines) => {
      if (!cancelled) setLoaded({ key, lines });
    });
    return () => {
      cancelled = true;
    };
    // `key` stands for `items`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (items.length === 0) return { lines: [], loading: false, empty: true };
  if (loaded?.key !== key) return { lines: loaded?.lines ?? [], loading: true, empty: false };
  return { lines: loaded.lines, loading: false, empty: false };
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((n, l) => (l.problem ? n : n + l.unitCents * l.travellers), 0);
}
