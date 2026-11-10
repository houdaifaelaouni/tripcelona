import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ cacheLife: () => {}, cacheTag: () => {} }));
const { settingsFromRows, legalTokens, whatsappLink } = await import("@/lib/settings");
const { contactSchema, quoteSchema, formObject, fieldErrors } = await import("@/lib/forms/schema");
const { site } = await import("@/lib/site");

describe("settingsFromRows", () => {
  it("falls back to the site defaults when nothing is set", () => {
    const s = settingsFromRows([]);
    expect(s.phoneDisplay).toBe(site.phoneDisplay);
    expect(s.whatsappDisplay).toBe(site.phoneDisplay);
    expect(s.email).toBeNull();
    expect(s.banner.active).toBe(false);
    expect(s.quoteExtras).toEqual([]);
    expect(s.legal).toEqual({ titular: null, nif: null, domicilio: null });
  });

  it("reads phone, WhatsApp and email, treating empty strings as unset", () => {
    const s = settingsFromRows([
      { key: "phone", value: "+34 600 11 22 33" },
      { key: "whatsapp", value: "+34 699 00 00 00" },
      { key: "email", value: "  " },
    ]);
    expect(s.phoneHref).toBe("tel:+34600112233");
    expect(s.whatsappHref).toBe("https://wa.me/34699000000");
    expect(s.email).toBeNull();
    expect(whatsappLink(s, "Hola y adiós")).toBe(
      "https://wa.me/34699000000?text=Hola%20y%20adi%C3%B3s",
    );
  });

  it("keeps only https social links for known networks", () => {
    const s = settingsFromRows([
      {
        key: "socials",
        value: {
          instagram: "https://instagram.com/x",
          facebook: "javascript:alert(1)",
          myspace: "https://myspace.com/x",
        },
      },
    ]);
    expect(s.socials).toEqual({ instagram: "https://instagram.com/x" });
  });

  it("shows the banner only when it is active and has text", () => {
    expect(
      settingsFromRows([{ key: "banner", value: { active: true, text: " " } }]).banner.active,
    ).toBe(false);
    expect(
      settingsFromRows([{ key: "banner", value: { active: true, text: "Aviso" } }]).banner.active,
    ).toBe(true);
  });
});

describe("legalTokens", () => {
  it("only fills the legal data the owner has entered", () => {
    const s = settingsFromRows([
      { key: "email", value: "hola@example.com" },
      { key: "legal_identity", value: { titular: "Empresa SL", nif: "", domicilio: null } },
    ]);
    const t = legalTokens(s);
    expect(t).toMatchObject({
      web: "tripcelona.com",
      email: "hola@example.com",
      titular: "Empresa SL",
    });
    expect(t.nif).toBeUndefined();
    expect(t.domicilio).toBeUndefined();
  });
});

describe("form schemas", () => {
  const contact = {
    name: "Ana",
    email: " Ana@Example.com ",
    message: "Quiero información para un grupo.",
    privacy: "on",
  };

  it("accepts a valid contact message and normalises the email", () => {
    const r = contactSchema.parse(contact);
    expect(r.email).toBe("ana@example.com");
    expect(r.phone).toBeNull();
    expect(r.newsletter).toBe(false);
  });

  it("requires privacy consent even when the field is missing", () => {
    const rest: Partial<typeof contact> = { ...contact };
    delete rest.privacy;
    const r = contactSchema.safeParse(rest);
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).privacy).toMatch(/privacidad/);
  });

  it("flags a filled honeypot", () => {
    const r = contactSchema.safeParse({ ...contact, website: "x" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path[0]).toBe("website");
  });

  it("validates the quote group size and phone", () => {
    const base = {
      tour: "a-medida",
      dates: "Mayo",
      groupSize: "12",
      name: "Grupo",
      email: "g@example.com",
      phone: "600000000",
      privacy: "on",
    };
    expect(quoteSchema.parse(base).groupSize).toBe(12);
    const bad = quoteSchema.safeParse({ ...base, groupSize: "0", phone: "1" });
    expect(bad.success).toBe(false);
    if (!bad.success)
      expect(Object.keys(fieldErrors(bad.error)).sort()).toEqual(["groupSize", "phone"]);
  });

  it("collects repeated fields into arrays and drops action ids", () => {
    const f = new FormData();
    f.append("extras", "Guía");
    f.append("extras", "Comida");
    f.append("$ACTION_ID_x", "");
    f.append("name", "Ana");
    expect(formObject(f, ["extras", "other"])).toEqual({
      extras: ["Guía", "Comida"],
      other: [],
      name: "Ana",
    });
  });
});
