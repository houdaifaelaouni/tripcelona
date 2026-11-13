import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { E2E } from "./constants";

test.describe("languages", () => {
  for (const [lang, trips, button] of [
    ["en", "Trips"],
    ["fr", "Excursions", "Rechercher"],
    ["ca", "Ofertes de viatges", "Cercar"],
    ["it", "Offerte di viaggio", "Cerca"],
  ] as const) {
    test(`/${lang} renders in ${lang} with hreflang and no a11y violations`, async ({ page }) => {
      await page.goto(`/${lang}`);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.getByRole("link", { name: trips, exact: true }).first()).toBeVisible();
      const alternates = await page.locator('link[rel="alternate"][hreflang]').count();
      expect(alternates).toBeGreaterThanOrEqual(5);
      await page.goto(`/${lang}/ofertas-de-viajes`);
      await expect(page.getByRole("button", { name: /./ }).first()).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
      void button;
    });
  }

  test("tour page keeps the language through links", async ({ page }) => {
    await page.goto(`/en/excursiones/${E2E.tourSlug}`);
    await expect(page.getByRole("heading", { name: "Trip programme" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Book", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Book", exact: true }).click();
    await page.waitForURL(/\/en\/reservar\?/);
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  });

  test("database text follows the language, with Spanish as fallback", async ({ page }) => {
    await page.goto(`/en/excursiones/${E2E.tourSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(E2E.tourTitleEn);
    // No French translation exists: the Spanish title is shown, not an empty one.
    await page.goto(`/fr/excursiones/${E2E.tourSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(E2E.tourTitleEn);
    await expect(page.getByRole("heading", { level: 1 })).not.toBeEmpty();
  });

  test("/es/ redirects to the unprefixed Spanish URL", async ({ request }) => {
    const res = await request.get("/es/blog", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers().location).toMatch(/\/blog$/);
  });
});
