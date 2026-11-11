import { test } from "@playwright/test";
import { E2E, e2eOwnerPassword } from "./constants";

/**
 * Visual snapshots for the UI rebuild (docs/ui-rebuild/scrum-plan.md, UI-1.5).
 * Opt-in: `SCREENSHOTS=1 pnpm e2e screens`. Images go to ./screenshots/
 * (gitignored) and are compared by eye between sprints.
 */
test.skip(!process.env.SCREENSHOTS, "set SCREENSHOTS=1 to capture");

const PUBLIC = [
  ["home", "/"],
  ["catalog", "/ofertas-de-viajes"],
  ["tour", `/excursiones/${E2E.tourSlug}`],
  ["quote", "/crea-tu-tour"],
  ["contact", "/contactanos"],
  ["faq", "/preguntas-frecuentes"],
  ["404", "/no-existe-esta-pagina"],
] as const;

for (const [name, path] of PUBLIC) {
  test(`screen ${name}`, async ({ page }, info) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `screenshots/${info.project.name}-${name}.png`, fullPage: true });
  });
}

test("screen admin", async ({ page }, info) => {
  await page.goto("/admin/componentes");
  await page.waitForURL(/\/admin\/login/);
  await page.screenshot({ path: `screenshots/${info.project.name}-admin-login.png` });
  await page.locator("input[name=email]").fill(E2E.ownerEmail);
  await page.locator("input[name=password]").fill(e2eOwnerPassword());
  await page.locator("button[type=submit]").click();
  await page.waitForURL(/\/admin\/componentes/);
  await page.getByRole("heading", { level: 1, name: "Componentes" }).waitFor();
  await page.screenshot({
    path: `screenshots/${info.project.name}-admin-components.png`,
    fullPage: true,
  });
  for (const [name, path] of [
    ["dashboard", "/admin"],
    ["bookings", "/admin/reservas"],
    ["settings", "/admin/ajustes?ok=ajustes"],
  ]) {
    await page.goto(path);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.screenshot({ path: `screenshots/${info.project.name}-admin-${name}.png` });
  }
});
