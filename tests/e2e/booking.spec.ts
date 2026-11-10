import { expect, test } from "@playwright/test";
import { E2E } from "./constants";

test.describe("booking", () => {
  test("home → catalog → tour → checkout → card payment → confirmation @mobile", async ({
    page,
  }) => {
    const csp: string[] = [];
    page.on("console", (m) => {
      if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text());
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto("/ofertas-de-viajes");
    const card = page.locator(`a[href="/excursiones/${E2E.tourSlug}"]`).first();
    await expect(card).toBeVisible();
    await card.click();
    await page.waitForURL(`**/excursiones/${E2E.tourSlug}`);

    // Pick the e2e departure (the last open one) for 2 travellers.
    const radio = page.locator("input[name=salida]:not([disabled])").last();
    await radio.check();
    await page.locator("input[name=personas]").fill("2");
    await page.getByRole("button", { name: "Reservar" }).click();
    await page.waitForURL(/\/reservar\?/);

    await page.locator("input[name=name]").fill("Prueba E2E");
    await page.locator("input[name=email]").fill("e2e-booking@example.com");
    await page.locator("input[name=phone]").fill("+34 600 000 000");
    await page.locator("input[name=terms]").check();
    await page.getByRole("button", { name: "Continuar al pago" }).click();
    await page.waitForURL(/\/reservar\/pendiente/);

    // Declined first: the booking stays payable.
    await page.getByRole("button", { name: "Pagar con tarjeta" }).click();
    await expect(page.locator("text=firma válida")).toBeVisible();
    await page.getByRole("button", { name: "Denegar" }).click();
    await page.waitForURL(/pago=error/);
    await expect(page.getByText("El pago no se ha completado.")).toBeVisible();

    await page.getByRole("button", { name: "Pagar con tarjeta" }).click();
    await page.getByRole("button", { name: "Autorizar" }).click();
    await page.waitForURL(/\/reservar\/confirmada/);
    await expect(page.getByText("¡Reserva confirmada!")).toBeVisible({ timeout: 15_000 });

    const id = new URL(page.url()).searchParams.get("id");
    const ics = await page.request.get(`/reservar/confirmada/calendario?id=${id}`);
    expect(ics.ok()).toBe(true);
    expect(await ics.text()).toContain("BEGIN:VEVENT");
    expect(csp, "CSP violations during booking").toEqual([]);
  });
});
