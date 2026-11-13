import { createHash, timingSafeEqual } from "node:crypto";

/**
 * PAYCOMET (Banco Sabadell TPV Virtual) hosted-payment integration.
 *
 * Pure functions only: no env access, so they can be unit-tested. Server
 * config lives in ./config.ts. Sources: docs.paycomet.com (REST reference
 * 3.7.0 for /v1/form and /v1/payments/{order}/refund; "Operation notification"
 * for the URLNOTIFY fields and the NotificationHash).
 *
 * Flow: POST /v1/form (operationType 1) returns a challengeUrl, the customer
 * pays on PAYCOMET's page, and PAYCOMET POSTs the result to the notification
 * URL set in the control panel. Sandbox and live use the same host; the
 * terminal number decides which one runs.
 */

export const PAYCOMET_BASE_URL = "https://rest.paycomet.com";
export const CURRENCY_EUR = "EUR";

/** PAYCOMET operation types used here. */
export const OPERATION = { authorization: "1", refund: "2" } as const;

export type PaycometCredentials = {
  apiKey: string;
  /** Product / terminal number (sandbox and live have different ones). */
  terminal: string;
  /** "Código de cliente" (AccountCode in notifications). */
  customerCode: string;
  /** Terminal password, only used to check notification signatures. */
  password: string;
};

const sha512 = (value: string) => createHash("sha512").update(value, "utf8").digest("hex");
const md5 = (value: string) => createHash("md5").update(value, "utf8").digest("hex");

/** Order reference: 4 digits + 8 alphanumerics, unique per payment attempt. */
export { newOrderId } from "./redsys";

/** Body for POST /v1/form: a card payment on PAYCOMET's hosted page. */
export function buildFormRequest(
  creds: Pick<PaycometCredentials, "terminal">,
  payment: {
    order: string;
    amountCents: number;
    description: string;
    okUrl: string;
    koUrl: string;
  },
) {
  return {
    operationType: 1,
    language: "es",
    terminal: Number(creds.terminal),
    payment: {
      terminal: Number(creds.terminal),
      methods: [1], // 1 = card
      order: payment.order,
      amount: String(payment.amountCents),
      currency: CURRENCY_EUR,
      secure: 1, // always ask for 3D Secure
      productDescription: payment.description.slice(0, 120),
      userInteraction: 1,
      urlOk: payment.okUrl,
      urlKo: payment.koUrl,
    },
  };
}

/** Body for POST /v1/payments/{order}/refund. authCode comes from the paid notification. */
export function buildRefundRequest(
  creds: Pick<PaycometCredentials, "terminal">,
  refund: { amountCents: number; authCode: string; originalIp: string },
) {
  return {
    payment: {
      terminal: Number(creds.terminal),
      amount: String(refund.amountCents),
      currency: CURRENCY_EUR,
      authCode: refund.authCode,
      originalIp: refund.originalIp,
    },
  };
}

/**
 * NotificationHash = SHA512(AccountCode + TpvID + TransactionType + Order +
 * Amount + Currency + md5(password) + BankDateTime + Response).
 */
export function notificationHash(password: string, f: Record<string, string | undefined>): string {
  return sha512(
    [
      f.AccountCode,
      f.TpvID,
      f.TransactionType,
      f.Order,
      f.Amount,
      f.Currency,
      md5(password),
      f.BankDateTime,
      f.Response,
    ]
      .map((part) => part ?? "")
      .join(""),
  );
}

export type VerifiedNotification = {
  order: string;
  amountCents: number | null;
  transactionType: string;
  response: string;
  errorId: string;
  authCode: string | null;
  /** Approved card payment: Response OK and ErrorID 0. */
  authorized: boolean;
  params: Record<string, string>;
};

/**
 * Checks a notification came from PAYCOMET for this terminal. Returns null
 * when the hash does not match, or the terminal or customer is not ours.
 */
export function verifyNotification(
  creds: PaycometCredentials,
  fields: Record<string, string | null | undefined>,
): VerifiedNotification | null {
  const f: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) if (typeof value === "string") f[key] = value;

  const given = (f.NotificationHash ?? "").toLowerCase();
  if (!/^[0-9a-f]{128}$/.test(given)) return null;
  if (f.TpvID !== creds.terminal || f.AccountCode !== creds.customerCode) return null;

  const expected = notificationHash(creds.password, f);
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(given))) return null;
  if (!f.Order) return null;

  const amount = Number(f.Amount);
  const response = f.Response ?? "";
  const errorId = f.ErrorID ?? "";
  return {
    order: f.Order,
    amountCents: Number.isInteger(amount) && amount >= 0 ? amount : null,
    transactionType: f.TransactionType ?? "",
    response,
    errorId,
    authCode: f.AuthCode || null,
    authorized: response === "OK" && (errorId === "" || errorId === "0"),
    params: f,
  };
}
