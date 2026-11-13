import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildFormRequest,
  buildRefundRequest,
  notificationHash,
  verifyNotification,
} from "@/lib/payments/paycomet";

// Made-up credentials for tests; the real ones live in Vercel env.
const creds = { apiKey: "k", terminal: "89987", customerCode: "ABC123", password: "s3cret" };
const sha512 = (v: string) => createHash("sha512").update(v).digest("hex");
const md5 = (v: string) => createHash("md5").update(v).digest("hex");

function notification(overrides: Record<string, string> = {}) {
  const f: Record<string, string> = {
    AccountCode: "ABC123",
    TpvID: "89987",
    TransactionType: "1",
    Order: "1234ABCDEFGH",
    Amount: "16500",
    Currency: "EUR",
    BankDateTime: "20261113061500",
    Response: "OK",
    ErrorID: "0",
    AuthCode: "AC410397",
    ...overrides,
  };
  f.NotificationHash = notificationHash(creds.password, f);
  return f;
}

describe("PAYCOMET notification hash", () => {
  it("follows the documented formula", () => {
    const f = notification();
    const expected = sha512(
      "ABC123" +
        "89987" +
        "1" +
        "1234ABCDEFGH" +
        "16500" +
        "EUR" +
        md5("s3cret") +
        "20261113061500" +
        "OK",
    );
    expect(f.NotificationHash).toBe(expected);
  });

  it("accepts a genuine approved payment", () => {
    const v = verifyNotification(creds, notification());
    expect(v).toMatchObject({
      order: "1234ABCDEFGH",
      amountCents: 16500,
      authorized: true,
      authCode: "AC410397",
      transactionType: "1",
    });
  });

  it("treats a KO response or a non-zero ErrorID as refused", () => {
    expect(
      verifyNotification(creds, notification({ Response: "KO", ErrorID: "105" }))?.authorized,
    ).toBe(false);
    expect(verifyNotification(creds, notification({ ErrorID: "105" }))?.authorized).toBe(false);
  });

  it("rejects a forged or altered notification", () => {
    const f = notification();
    expect(verifyNotification(creds, { ...f, Amount: "100" })).toBeNull();
    expect(verifyNotification(creds, { ...f, NotificationHash: "0".repeat(128) })).toBeNull();
    expect(verifyNotification(creds, { ...f, NotificationHash: "" })).toBeNull();
    expect(verifyNotification({ ...creds, password: "other" }, f)).toBeNull();
  });

  it("rejects a notification for another terminal or customer", () => {
    expect(verifyNotification(creds, notification({ TpvID: "89986" }))).toBeNull();
    expect(verifyNotification(creds, notification({ AccountCode: "ZZZ" }))).toBeNull();
  });
});

describe("PAYCOMET requests", () => {
  it("builds a card payment form body with the server-side amount", () => {
    const body = buildFormRequest(creds, {
      order: "1234ABCDEFGH",
      amountCents: 16500,
      description: "TC-2026-0001 · Rupit",
      okUrl: "https://tripcelona.com/ok",
      koUrl: "https://tripcelona.com/ko",
    });
    expect(body).toMatchObject({
      operationType: 1,
      terminal: 89987,
      payment: {
        terminal: 89987,
        methods: [1],
        order: "1234ABCDEFGH",
        amount: "16500",
        currency: "EUR",
        secure: 1,
        urlOk: "https://tripcelona.com/ok",
        urlKo: "https://tripcelona.com/ko",
      },
    });
  });

  it("builds a refund body from the recorded authorisation code", () => {
    expect(
      buildRefundRequest(creds, {
        amountCents: 16500,
        authCode: "AC410397",
        originalIp: "127.0.0.1",
      }),
    ).toEqual({
      payment: {
        terminal: 89987,
        amount: "16500",
        currency: "EUR",
        authCode: "AC410397",
        originalIp: "127.0.0.1",
      },
    });
  });
});
