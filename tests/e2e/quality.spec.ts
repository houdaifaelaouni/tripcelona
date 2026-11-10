import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { E2E } from "./constants";

/** Key public pages (US-36, US-37). Content pages may be empty on a seed-only database. */
const PAGES = [
  "/",
  "/ofertas-de-viajes",
  `/excursiones/${E2E.tourSlug}`,
  "/crea-tu-tour",
  "/contactanos",
  "/preguntas-frecuentes",
  "/blog",
  "/no-existe-esta-pagina",
];

test.describe("accessibility (axe, WCAG 2.2 AA)", () => {
  for (const path of [...PAGES, "/admin/login"]) {
    test(`no critical or serious issues on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const blocking = violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      const summary = blocking.map(
        (v) =>
          `${v.impact} ${v.id}: ${v.help} (${v.nodes
            .map((n) => n.target.join(" "))
            .slice(0, 3)
            .join(", ")})`,
      );
      expect(summary, summary.join("\n")).toEqual([]);
    });
  }
});

test.describe("responsive layout", () => {
  for (const width of [360, 768, 1440]) {
    test(`no horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of PAGES) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${path} overflows by ${overflow}px at ${width}px`).toBeLessThanOrEqual(0);
      }
    });
  }
});

test("keyboard: skip link moves focus to the main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.locator(":focus");
  await expect(skip).toHaveAttribute("href", "#contenido");
  await page.keyboard.press("Enter");
  await expect(page.locator("#contenido")).toBeFocused();
});

test("keyboard: the departure picker and booking button are reachable", async ({ page }) => {
  await page.goto(`/excursiones/${E2E.tourSlug}`);
  await page.waitForLoadState("networkidle"); // live dates replace the cached list once streamed
  await page.locator("input[name=salida]:not([disabled])").first().focus();
  await page.keyboard.press("Space");
  await expect(page.locator("input[name=salida]:checked")).toHaveCount(1);
  for (let i = 0; i < 6; i++) {
    if (
      await page
        .getByRole("button", { name: "Reservar" })
        .evaluate((b) => b === document.activeElement)
    )
      break;
    await page.keyboard.press("Tab");
  }
  await expect(page.getByRole("button", { name: "Reservar" })).toBeFocused();
});

test("no Content-Security-Policy violations on public pages", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text()))
      violations.push(`${page.url()}: ${m.text()}`);
  });
  for (const path of [...PAGES, "/admin/login"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(violations).toEqual([]);
});
