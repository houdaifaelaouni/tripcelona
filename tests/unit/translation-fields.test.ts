import { describe, expect, it } from "vitest";
import { fieldName, parseFieldName, TRANSLATABLE } from "@/lib/admin/translation-fields";

const id = "0b6f3c2e-1d2a-4c5b-9e8f-112233445566";

describe("translation form fields", () => {
  it("round-trips entity, id and field", () => {
    const parsed = parseFieldName(fieldName("tour", id, "highlights"));
    expect(parsed?.entity).toBe("tour");
    expect(parsed?.id).toBe(id);
    expect(parsed?.def.kind).toBe("list");
  });

  it("rejects unknown entities, fields and ids", () => {
    expect(parseFieldName(`t|tours|${id}|title`)).toBeNull();
    expect(parseFieldName(`t|tour|${id}|price_from_cents`)).toBeNull();
    expect(parseFieldName("t|tour|not-a-uuid|title")).toBeNull();
    expect(parseFieldName(`x|tour|${id}|title`)).toBeNull();
  });

  it("only offers fields the public queries read", () => {
    // Keep in sync with src/lib/tours/queries.ts and src/lib/content/queries.ts.
    expect(TRANSLATABLE.post.map((d) => d.field)).toEqual([
      "title",
      "excerpt",
      "content",
      "seo_title",
      "seo_description",
    ]);
    expect(TRANSLATABLE.tour_itinerary.map((d) => d.field).sort()).toEqual([
      "body",
      "time_label",
      "title",
    ]);
  });
});
