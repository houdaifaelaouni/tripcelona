"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart/store";

/** The bookings exist now, so the browser's cart is emptied. */
export function ClearCart() {
  useEffect(() => clearCart(), []);
  return null;
}
