import { describe, expect, it } from "vitest";
import { placeholderAlt, targetPaths } from "@/lib/media/pipeline";

describe("media pipeline helpers", () => {
  it("keeps a stable base path and swaps the extension", () => {
    expect(targetPaths("tours/rupit/Garrotxa-4-1-scaled-1.jpg")).toEqual({
      base: "tours/rupit/Garrotxa-4-1-scaled-1",
      webp: "tours/rupit/Garrotxa-4-1-scaled-1.webp",
      avif: "tours/rupit/Garrotxa-4-1-scaled-1.avif",
    });
    expect(targetPaths("tours/x/natura-02.webp").webp).toBe("tours/x/natura-02.webp");
  });

  it("derives readable placeholder alt text, or null", () => {
    expect(placeholderAlt("tours/x/Carruaje-de-caballos-fageda-den-jorda.jpg")).toBe(
      "Carruaje caballos fageda den jorda",
    );
    expect(placeholderAlt("tours/x/Garrotxa-4-1-scaled-1.jpg")).toBe("Garrotxa");
    expect(placeholderAlt("tours/x/67437cb-053.jpg")).toBeNull();
  });
});
