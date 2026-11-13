/** Card logos and award badges, shown exactly as supplied by the owner. */
export const PAYMENT_METHODS = [
  { name: "Visa", src: "/brand/payments/visa.png" },
  { name: "Mastercard", src: "/brand/payments/mastercard.png" },
  { name: "American Express", src: "/brand/payments/amex.png" },
  { name: "UnionPay", src: "/brand/payments/unionpay.png" },
  { name: "Diners Club", src: "/brand/payments/diners.png" },
  { name: "Discover", src: "/brand/payments/discover.png" },
] as const;

/** Award badges, shown exactly as supplied by the owner. */
export const BADGES = [
  { name: "Tripadvisor", src: "/brand/badges/tripadvisor.png", width: 86, height: 86 },
  { name: "Insignia de diseño web", src: "/brand/badges/award-pencil.png", width: 86, height: 86 },
] as const;
