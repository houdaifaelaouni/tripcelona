import { createCipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Redsys redirect integration (decision D1), HMAC_SHA256_V1.
 *
 * Pure functions only: no env access, so they can be unit-tested. Server
 * config lives in ./config.ts.
 *
 * Signature = base64(HMAC-SHA256(orderKey, Ds_MerchantParameters)), where
 * orderKey = 3DES-CBC(secret, order zero-padded to 8 bytes, IV = 0).
 */

export const SIGNATURE_VERSION = "HMAC_SHA256_V1";
export const CURRENCY_EUR = "978";
export const LANGUAGE_ES = "001";

export const TRANSACTION = { authorization: "0", refund: "3" } as const;

export const REDSYS_URLS = {
  test: {
    redirect: "https://sis-t.redsys.es:25443/sis/realizarPago",
    rest: "https://sis-t.redsys.es:25443/sis/rest/trataPeticionREST",
  },
  live: {
    redirect: "https://sis.redsys.es/sis/realizarPago",
    rest: "https://sis.redsys.es/sis/rest/trataPeticionREST",
  },
} as const;

export type RedsysCredentials = { merchantCode: string; terminal: string; secretKey: string };

export type SignedRequest = {
  Ds_SignatureVersion: typeof SIGNATURE_VERSION;
  Ds_MerchantParameters: string;
  Ds_Signature: string;
};

/** Ds_Order: 12 chars, first 4 numeric, rest alphanumeric, unique per attempt. */
export function newOrderId(now = Date.now()): string {
  const digits = String(now % 10_000).padStart(4, "0");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const tail = Array.from(randomBytes(8), (b) => alphabet[b % alphabet.length]).join("");
  return digits + tail;
}

export function isValidOrderId(order: string): boolean {
  return /^[0-9]{4}[0-9A-Za-z]{0,8}$/.test(order);
}

function toStandardBase64(value: string): string {
  return value.replace(/-/g, "+").replace(/_/g, "/");
}

export function encodeParameters(params: Record<string, string>): string {
  return Buffer.from(JSON.stringify(params), "utf8").toString("base64");
}

/** Decodes Ds_MerchantParameters; notifications use base64url. */
export function decodeParameters(encoded: string): Record<string, string> {
  const json = Buffer.from(toStandardBase64(encoded), "base64").toString("utf8");
  const parsed: unknown = JSON.parse(json);
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid Ds_MerchantParameters");
  return parsed as Record<string, string>;
}

export function orderKey(secretKey: string, order: string): Buffer {
  const key = Buffer.from(secretKey, "base64");
  const data = Buffer.alloc(Math.ceil(Buffer.byteLength(order) / 8) * 8);
  data.write(order, "utf8");
  const cipher = createCipheriv("des-ede3-cbc", key, Buffer.alloc(8));
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(data), cipher.final()]);
}

export function sign(secretKey: string, order: string, encodedParams: string): string {
  return createHmac("sha256", orderKey(secretKey, order)).update(encodedParams).digest("base64");
}

function signaturesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(toStandardBase64(expected), "base64");
  const b = Buffer.from(toStandardBase64(received), "base64");
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

/** Read an Ds_* field regardless of the case Redsys used for it. */
export function field(params: Record<string, string>, name: string): string | undefined {
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(params)) {
    if (key.toLowerCase() === wanted) return value == null ? undefined : String(value);
  }
  return undefined;
}

export type PaymentRequestInput = {
  order: string;
  amountCents: number;
  description: string;
  holder?: string;
  notificationUrl: string;
  okUrl: string;
  koUrl: string;
};

export function buildPaymentRequest(creds: RedsysCredentials, input: PaymentRequestInput) {
  if (!isValidOrderId(input.order)) throw new Error(`Invalid Redsys order ${input.order}`);
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0)
    throw new Error("Amount must be a positive number of cents");
  const params: Record<string, string> = {
    DS_MERCHANT_AMOUNT: String(input.amountCents),
    DS_MERCHANT_ORDER: input.order,
    DS_MERCHANT_MERCHANTCODE: creds.merchantCode,
    DS_MERCHANT_CURRENCY: CURRENCY_EUR,
    DS_MERCHANT_TRANSACTIONTYPE: TRANSACTION.authorization,
    DS_MERCHANT_TERMINAL: creds.terminal,
    DS_MERCHANT_MERCHANTURL: input.notificationUrl,
    DS_MERCHANT_URLOK: input.okUrl,
    DS_MERCHANT_URLKO: input.koUrl,
    DS_MERCHANT_CONSUMERLANGUAGE: LANGUAGE_ES,
    DS_MERCHANT_PRODUCTDESCRIPTION: input.description.slice(0, 125),
    DS_MERCHANT_MERCHANTNAME: "Tripcelona",
  };
  if (input.holder) params.DS_MERCHANT_TITULAR = input.holder.slice(0, 60);
  const encoded = encodeParameters(params);
  return {
    Ds_SignatureVersion: SIGNATURE_VERSION,
    Ds_MerchantParameters: encoded,
    Ds_Signature: sign(creds.secretKey, input.order, encoded),
  } satisfies SignedRequest;
}

export function buildRefundRequest(
  creds: RedsysCredentials,
  input: { order: string; amountCents: number },
): SignedRequest {
  const params = {
    DS_MERCHANT_AMOUNT: String(input.amountCents),
    DS_MERCHANT_ORDER: input.order,
    DS_MERCHANT_MERCHANTCODE: creds.merchantCode,
    DS_MERCHANT_CURRENCY: CURRENCY_EUR,
    DS_MERCHANT_TRANSACTIONTYPE: TRANSACTION.refund,
    DS_MERCHANT_TERMINAL: creds.terminal,
  };
  const encoded = encodeParameters(params);
  return {
    Ds_SignatureVersion: SIGNATURE_VERSION,
    Ds_MerchantParameters: encoded,
    Ds_Signature: sign(creds.secretKey, input.order, encoded),
  };
}

export type VerifiedResult = {
  order: string;
  amountCents: number | null;
  response: number | null;
  transactionType: string | null;
  authorized: boolean;
  params: Record<string, string>;
};

/**
 * Verify a signed Redsys message (notification or REST response). Returns null
 * when the signature does not match: callers must then ignore the message.
 */
export function verifySignedMessage(
  secretKey: string,
  message: { Ds_MerchantParameters?: string | null; Ds_Signature?: string | null },
): VerifiedResult | null {
  if (!message.Ds_MerchantParameters || !message.Ds_Signature) return null;
  let params: Record<string, string>;
  try {
    params = decodeParameters(message.Ds_MerchantParameters);
  } catch {
    return null;
  }
  const order = field(params, "Ds_Order");
  if (!order || !isValidOrderId(order)) return null;
  const expected = sign(secretKey, order, message.Ds_MerchantParameters);
  if (!signaturesMatch(expected, message.Ds_Signature)) return null;

  const amount = Number(field(params, "Ds_Amount"));
  const response = Number(field(params, "Ds_Response"));
  const hasResponse = Number.isInteger(response) && field(params, "Ds_Response") !== undefined;
  return {
    order,
    amountCents: Number.isInteger(amount) ? amount : null,
    response: hasResponse ? response : null,
    transactionType: field(params, "Ds_TransactionType") ?? null,
    // Redsys: 0000–0099 means an authorised payment.
    authorized: hasResponse && response >= 0 && response <= 99,
    params,
  };
}

/** Redsys answers 0900 to an accepted refund. */
export function isRefundAccepted(result: VerifiedResult): boolean {
  return result.response === 900;
}
