import { describe, expect, it } from "vitest";
import {
  buildPaymentRequest,
  buildRefundRequest,
  decodeParameters,
  encodeParameters,
  isRefundAccepted,
  isValidOrderId,
  newOrderId,
  sign,
  verifySignedMessage,
} from "@/lib/payments/redsys";

// Redsys' published test key (public sandbox credentials, not a secret).
const KEY = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";
const creds = { merchantCode: "999008881", terminal: "1", secretKey: KEY };

describe("Redsys signature", () => {
  it("matches an independent openssl computation", () => {
    // Reference produced with: openssl enc -des-ede3-cbc (order key) + openssl dgst -hmac.
    const params =
      "eyJEU19NRVJDSEFOVF9BTU9VTlQiOiIxNDUiLCJEU19NRVJDSEFOVF9PUkRFUiI6IjE0NDYwNjg1ODEiLCJEU19NRVJDSEFOVF9NRVJDSEFOVENPREUiOiI5OTkwMDg4ODEiLCJEU19NRVJDSEFOVF9DVVJSRU5DWSI6Ijk3OCIsIkRTX01FUkNIQU5UX1RSQU5TQUNUSU9OVFlQRSI6IjAiLCJEU19NRVJDSEFOVF9URVJNSU5BTCI6IjEifQ==";
    expect(sign(KEY, "1446068581", params)).toBe("WFo2U4uBjjSMNrb3ISYMD3Vy+wWmPO9eK5iqrnZ8c54=");
  });

  it("builds a signed payment request from server values", () => {
    const req = buildPaymentRequest(creds, {
      order: "1234ABCDEFGH",
      amountCents: 16500,
      description: "TC-2026-0001 · Rupit",
      notificationUrl: "https://tripcelona.com/api/pagos/redsys/notificacion",
      okUrl: "https://tripcelona.com/ok",
      koUrl: "https://tripcelona.com/ko",
    });
    const params = decodeParameters(req.Ds_MerchantParameters);
    expect(params).toMatchObject({
      DS_MERCHANT_AMOUNT: "16500",
      DS_MERCHANT_ORDER: "1234ABCDEFGH",
      DS_MERCHANT_CURRENCY: "978",
      DS_MERCHANT_TRANSACTIONTYPE: "0",
    });
    expect(req.Ds_Signature).toBe(sign(KEY, "1234ABCDEFGH", req.Ds_MerchantParameters));
  });

  it("rejects bad orders and amounts", () => {
    const base = { description: "x", notificationUrl: "u", okUrl: "u", koUrl: "u" };
    expect(() =>
      buildPaymentRequest(creds, { ...base, order: "ABCD1234", amountCents: 1 }),
    ).toThrow();
    expect(() =>
      buildPaymentRequest(creds, { ...base, order: "1234ABCD", amountCents: 0 }),
    ).toThrow();
    expect(() =>
      buildPaymentRequest(creds, { ...base, order: "1234ABCD", amountCents: 1.5 }),
    ).toThrow();
  });

  it("generates valid, unique order ids", () => {
    const ids = new Set(Array.from({ length: 200 }, () => newOrderId()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(isValidOrderId(id) && id.length === 12).toBe(true);
  });
});

function notification(params: Record<string, string>, key = KEY) {
  const encoded = encodeParameters(params).replace(/\+/g, "-").replace(/\//g, "_");
  const signature = sign(key, params.Ds_Order, encoded).replace(/\+/g, "-").replace(/\//g, "_");
  return { Ds_MerchantParameters: encoded, Ds_Signature: signature };
}

describe("Redsys notification verification", () => {
  const ok = {
    Ds_Order: "1234ABCDEFGH",
    Ds_Amount: "16500",
    Ds_Response: "0000",
    Ds_TransactionType: "0",
  };

  it("accepts a correctly signed authorised notification (base64url)", () => {
    const result = verifySignedMessage(KEY, notification(ok));
    expect(result).toMatchObject({
      order: "1234ABCDEFGH",
      amountCents: 16500,
      response: 0,
      authorized: true,
    });
  });

  it("treats responses above 0099 as declined", () => {
    expect(verifySignedMessage(KEY, notification({ ...ok, Ds_Response: "0190" }))?.authorized).toBe(
      false,
    );
  });

  it("rejects a forged signature", () => {
    expect(
      verifySignedMessage(KEY, notification(ok, Buffer.alloc(24, 7).toString("base64"))),
    ).toBeNull();
  });

  it("rejects tampered parameters", () => {
    const n = notification(ok);
    const tampered = encodeParameters({ ...ok, Ds_Amount: "1" });
    expect(verifySignedMessage(KEY, { ...n, Ds_MerchantParameters: tampered })).toBeNull();
  });

  it("rejects missing or malformed fields", () => {
    expect(verifySignedMessage(KEY, {})).toBeNull();
    expect(
      verifySignedMessage(KEY, { Ds_MerchantParameters: "not-json", Ds_Signature: "x" }),
    ).toBeNull();
  });

  it("recognises an accepted refund", () => {
    const req = buildRefundRequest(creds, { order: "1234ABCDEFGH", amountCents: 16500 });
    expect(decodeParameters(req.Ds_MerchantParameters).DS_MERCHANT_TRANSACTIONTYPE).toBe("3");
    const reply = verifySignedMessage(
      KEY,
      notification({ ...ok, Ds_Response: "0900", Ds_TransactionType: "3" }),
    );
    expect(reply && isRefundAccepted(reply)).toBe(true);
  });
});
