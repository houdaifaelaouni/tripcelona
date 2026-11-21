import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ cacheLife: () => {}, cacheTag: () => {} }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(),
}));

import { attributionFromUrl, parseAttribution, trackingFromValue } from "@/lib/tracking/shared";

const sha = (v: string) => createHash("sha256").update(v).digest("hex");

describe("attribution", () => {
  it("keeps UTM tags and click ids from the landing URL", () => {
    const a = attributionFromUrl(
      new URL(
        "https://www.tripcelona.com/l/navidad?utm_source=facebook&utm_medium=paid_social&utm_campaign=andorra&fbclid=XYZ",
      ),
      "https://l.facebook.com/",
    )!;
    expect(a.utm_source).toBe("facebook");
    expect(a.utm_campaign).toBe("andorra");
    expect(a.fbclid).toBe("XYZ");
    expect(a.landing).toBe(
      "/l/navidad?utm_source=facebook&utm_medium=paid_social&utm_campaign=andorra&fbclid=XYZ",
    );
  });

  it("names the platform of an untagged ad click", () => {
    const a = attributionFromUrl(new URL("https://www.tripcelona.com/?gclid=abc"), "")!;
    expect(a).toMatchObject({ utm_source: "google", utm_medium: "paid", gclid: "abc" });
  });

  it("ignores internal navigation without tags", () => {
    expect(
      attributionFromUrl(
        new URL("https://www.tripcelona.com/carrito"),
        "https://www.tripcelona.com/",
      ),
    ).toBeNull();
  });

  it("parses only known keys from the cookie", () => {
    expect(parseAttribution('{"utm_source":"tiktok","evil":"x"}')).toEqual({
      utm_source: "tiktok",
    });
    expect(parseAttribution("not json")).toBeNull();
  });
});

describe("tracking config", () => {
  it("drops ids in the wrong format", () => {
    const c = trackingFromValue({
      metaPixelId: "1234567890123",
      gtmId: "GTM-ABC12",
      ga4Id: "UA-1",
      tiktokPixelId: "<script>",
    });
    expect(c.metaPixelId).toBe("1234567890123");
    expect(c.gtmId).toBe("GTM-ABC12");
    expect(c.ga4Id).toBeNull();
    expect(c.tiktokPixelId).toBeNull();
  });
});

describe("conversions API payloads", () => {
  it("hashes email and phone and keeps the shared event id", async () => {
    const { metaPurchaseEvent, tiktokPurchaseEvent, normalisePhone } =
      await import("@/lib/tracking/conversions");
    expect(normalisePhone("666 69 69 54")).toBe("34666696954");
    expect(normalisePhone("+33 6 12 34 56 78")).toBe("33612345678");
    const facts = {
      eventId: "b1",
      reference: "TC-2026-0001",
      email: " Ana@Example.com ",
      phone: "666696954",
      valueCents: 7000,
      items: [{ id: "andorra", name: "Andorra", quantity: 2, priceCents: 3500 }],
      attribution: { consent: true, fbp: "fb.1.1.1", ttclid: "tt" },
    };
    const meta = metaPurchaseEvent(facts, 1_700_000_000_000);
    expect(meta.event_id).toBe("b1");
    expect(meta.user_data.em).toEqual([sha("ana@example.com")]);
    expect(meta.user_data.ph).toEqual([sha("34666696954")]);
    expect(meta.custom_data).toMatchObject({
      value: 70,
      currency: "EUR",
      order_id: "TC-2026-0001",
    });
    const tt = tiktokPurchaseEvent(facts, 1_700_000_000_000);
    expect(tt.event).toBe("CompletePayment");
    expect(tt.user).toMatchObject({ email: sha("ana@example.com"), ttclid: "tt" });
  });
});

describe("tickets", () => {
  it("makes readable, unguessable codes", async () => {
    const { newTicketCode, prettyCode } = await import("@/lib/tickets/codes");
    const codes = new Set(Array.from({ length: 200 }, newTicketCode));
    expect(codes.size).toBe(200);
    for (const c of codes) expect(c).toMatch(/^[A-HJ-NP-Z2-9]{10}$/);
    expect(prettyCode("ABCDEFGHJK")).toBe("ABCD EFGH JK");
  });

  it("masks the ID document", async () => {
    const { maskDocument } = await import("@/lib/tickets/queries");
    expect(maskDocument("12345678Z")).toBe("••••••78Z");
    expect(maskDocument(null)).toBe("—");
  });
});
