import { describe, expect, it } from "vitest";
import { legacyDownloadUrl, placeholderAlt, targetPaths } from "@/lib/media/pipeline";

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

  it("downloads legacy images from the old WordPress host once it moves", () => {
    const src = "https://tripcelona.com/wp-content/uploads/2025/11/Rupit.jpg";
    expect(legacyDownloadUrl(src, undefined)).toBe(src);
    expect(legacyDownloadUrl(src, "https://antiguo.tripcelona.com")).toBe(
      "https://antiguo.tripcelona.com/wp-content/uploads/2025/11/Rupit.jpg",
    );
    expect(
      legacyDownloadUrl(
        "https://www.tripcelona.com/wp-content/uploads/a.png",
        "https://wp.example.org",
      ),
    ).toBe("https://wp.example.org/wp-content/uploads/a.png");
    expect(legacyDownloadUrl("https://cdn.other.com/a.png", "https://wp.example.org")).toBe(
      "https://cdn.other.com/a.png",
    );
  });
});
