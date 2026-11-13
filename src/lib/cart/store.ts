"use client";

import { useSyncExternalStore } from "react";
import { MAX_TRAVELLERS } from "@/lib/booking/schema";

/**
 * The shopping cart lives in the browser (localStorage): only departure ids
 * and traveller counts. Prices and availability are always read again from
 * the server, so nothing here can change what is charged.
 */
export type CartItem = { departureId: string; travellers: number };

const KEY = "tc_cart";
export const CART_MAX_ITEMS = 6;
const EMPTY: CartItem[] = [];

let cache: { raw: string | null; items: CartItem[] } = { raw: null, items: EMPTY };
const listeners = new Set<() => void>();

function read(): CartItem[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return cache.items;
  }
  if (raw === cache.raw) return cache.items;
  let items: CartItem[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      items = parsed
        .filter(
          (i): i is CartItem =>
            !!i &&
            typeof i.departureId === "string" &&
            Number.isInteger(i.travellers) &&
            i.travellers > 0,
        )
        .slice(0, CART_MAX_ITEMS);
    }
  } catch {
    items = EMPTY;
  }
  cache = { raw, items };
  return items;
}

function write(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Private mode: the in-memory cache still serves this page view.
    cache = { raw: JSON.stringify(items), items };
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Adds travellers to a departure already in the cart, or a new line. */
export function addToCart(departureId: string, travellers: number): "added" | "full" {
  const items = read();
  const existing = items.find((i) => i.departureId === departureId);
  if (!existing && items.length >= CART_MAX_ITEMS) return "full";
  write(
    existing
      ? items.map((i) =>
          i === existing
            ? { ...i, travellers: Math.min(i.travellers + travellers, MAX_TRAVELLERS) }
            : i,
        )
      : [...items, { departureId, travellers }],
  );
  return "added";
}

export function setCartQuantity(departureId: string, travellers: number) {
  write(
    read().map((i) =>
      i.departureId === departureId
        ? { ...i, travellers: Math.min(Math.max(travellers, 1), MAX_TRAVELLERS) }
        : i,
    ),
  );
}

export function removeFromCart(departureId: string) {
  write(read().filter((i) => i.departureId !== departureId));
}

export function clearCart() {
  write([]);
}
