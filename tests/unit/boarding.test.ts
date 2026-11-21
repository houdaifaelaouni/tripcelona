import { beforeAll, describe, expect, it } from "vitest";
import { whatsappTicketHref } from "@/lib/tickets/display";

describe("WhatsApp ticket link", () => {
  it("adds +34 to Spanish mobiles and keeps international numbers", () => {
    expect(whatsappTicketHref("666 69 69 54", "hola")).toBe("https://wa.me/34666696954?text=hola");
    expect(whatsappTicketHref("+33 6 12 34 56 78", "x")).toBe("https://wa.me/33612345678?text=x");
    expect(whatsappTicketHref("0034666696954", "x")).toBe("https://wa.me/34666696954?text=x");
    expect(whatsappTicketHref(null, "x")).toBeNull();
    expect(whatsappTicketHref("123", "x")).toBeNull();
  });
});

describe("driver links", () => {
  beforeAll(() => {
    process.env.DRIVER_LINK_SECRET = "test-secret";
  });

  it("accepts only the key of its own departure", async () => {
    const { driverKey, isDriverKey } = await import("@/lib/tickets/driver");
    const a = "00000000-0000-4000-8000-00000000000a";
    const b = "00000000-0000-4000-8000-00000000000b";
    expect(isDriverKey(a, driverKey(a))).toBe(true);
    expect(isDriverKey(b, driverKey(a))).toBe(false);
    expect(isDriverKey(a, "")).toBe(false);
  });

  it("reads the reference from any ticket QR", async () => {
    const { referenceFromScan } = await import("@/lib/tickets/driver");
    expect(referenceFromScan("https://tripcelona.com/admin/billetes/TC-2026-0042")).toBe(
      "TC-2026-0042",
    );
    expect(referenceFromScan("TRIPCELONA:tc-2026-0007")).toBe("TC-2026-0007");
    expect(referenceFromScan("%E0%A4%A")).toBeNull();
    expect(referenceFromScan("hello")).toBeNull();
  });
});
