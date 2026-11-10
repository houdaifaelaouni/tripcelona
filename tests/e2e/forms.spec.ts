import { expect, test } from "@playwright/test";
import { E2E } from "./constants";

test("quote request through the four-step wizard @mobile", async ({ page }) => {
  await page.goto(`/crea-tu-tour?excursion=${E2E.tourSlug}`);
  await expect(page.locator("select[name=tour]")).toHaveValue(E2E.tourSlug);
  const next = () => page.getByRole("button", { name: "Siguiente" }).click();
  await next();
  await page.locator("input[name=dates]").fill("Cualquier sábado de marzo");
  await page.locator("input[name=groupSize]").fill("20");
  await next();
  await next();
  await page.locator("input[name=name]").fill("Grupo E2E");
  await page.locator("input[name=email]").fill("e2e-quote@example.com");
  await page.locator("input[name=phone]").fill("+34 600 000 001");
  await page.locator("input[name=privacy]").check();
  await page.getByRole("button", { name: "Solicitar presupuesto" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Solicitud enviada" })).toBeVisible();
});

test("contact message", async ({ page }) => {
  await page.goto("/contactanos");
  await page.locator("input[name=name]").fill("Contacto E2E");
  await page.locator("input[name=email]").fill("e2e-contact@example.com");
  await page.locator("textarea[name=message]").fill("¿Tenéis salidas privadas para empresas?");
  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.locator("#privacy-error")).toBeVisible();
  await page.locator("input[name=privacy]").check();
  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Mensaje enviado" })).toBeVisible();
});
