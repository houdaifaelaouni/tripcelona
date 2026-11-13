import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-for-tests";

describe("payment secrets", () => {
  it("round-trips a value and never stores it in the clear", async () => {
    const { encryptValue, decryptValue } = await import("@/lib/payments/secrets");
    const stored = encryptValue("sk_test_abc123");
    expect(stored).not.toContain("sk_test_abc123");
    expect(stored.startsWith("v1:")).toBe(true);
    expect(decryptValue(stored)).toBe("sk_test_abc123");
  });

  it("uses a fresh nonce each time", async () => {
    const { encryptValue } = await import("@/lib/payments/secrets");
    expect(encryptValue("same")).not.toBe(encryptValue("same"));
  });

  it("treats a tampered or foreign value as not saved", async () => {
    const { encryptValue, decryptValue } = await import("@/lib/payments/secrets");
    const parts = encryptValue("secret").split(":");
    parts[3] = Buffer.from("tampered").toString("base64");
    expect(decryptValue(parts.join(":"))).toBeNull();
    expect(decryptValue("plain text")).toBeNull();
  });
});
