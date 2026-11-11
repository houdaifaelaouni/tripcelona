import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { E2E, e2eOwnerPassword } from "./constants";

test("owner signs in and publishes a blog post", async ({ page }) => {
  const csp: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text());
  });
  await page.goto("/admin");
  await page.waitForURL(/\/admin\/login/);
  await page.locator("input[name=email]").fill(E2E.ownerEmail);
  await page.locator("input[name=password]").fill(e2eOwnerPassword());
  await page.locator("button[type=submit]").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/admin/login"));

  // Owner home with the health panel (US-41): visible and accessible.
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Estado de la web (24 h)" })).toBeVisible();
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    violations.filter((v) => v.impact === "critical" || v.impact === "serious").map((v) => v.id),
  ).toEqual([]);

  await page.goto("/admin/blog");
  await page.getByRole("button", { name: "Nueva entrada" }).click();
  await page.waitForURL(/\/admin\/blog\/[0-9a-f-]{36}$/);
  const slug = `e2e-${Date.now()}`;
  await page.locator("input[name=title]").fill("Entrada publicada por la prueba e2e");
  await page.locator("input[name=slug]").fill(slug);
  await page.locator(".ProseMirror").fill("Texto de la entrada de prueba.");
  await page.locator("select[name=status]").selectOption("published");
  await page.getByRole("button", { name: "Guardar" }).click();
  await page.waitForURL(/ok=publicado/);

  const res = await page.goto(`/blog/${slug}`);
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Entrada publicada por la prueba e2e",
  );
  expect(csp, "CSP violations in the admin").toEqual([]);
});

test("component gallery renders and passes axe", async ({ page }) => {
  await page.goto("/admin/componentes");
  await page.waitForURL(/\/admin\/login/);
  await page.locator("input[name=email]").fill(E2E.ownerEmail);
  await page.locator("input[name=password]").fill(e2eOwnerPassword());
  await page.locator("button[type=submit]").click();
  await page.waitForURL(/\/admin\/componentes/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Componentes");

  // The stepper is interactive and keeps a form value.
  const qty = page.locator("input[name=demo-qty]");
  await expect(qty).toHaveValue("1");
  await page.getByRole("button", { name: "Añadir uno (Personas)" }).click();
  await expect(qty).toHaveValue("2");

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(
    blocking.map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`),
  ).toEqual([]);
});

test("main admin screens pass axe and the toast can be dismissed", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForURL(/\/admin\/login/);
  await page.locator("input[name=email]").fill(E2E.ownerEmail);
  await page.locator("input[name=password]").fill(e2eOwnerPassword());
  await page.locator("button[type=submit]").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/admin/login"));

  for (const path of [
    "/admin",
    "/admin/excursiones",
    "/admin/reservas",
    "/admin/solicitudes",
    "/admin/blog",
    "/admin/ajustes",
    "/admin/cuenta",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const blocking = violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(
      blocking.map(
        (v) => `${path} ${v.impact} ${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`,
      ),
    ).toEqual([]);
  }

  // Success messages show as a dismissible toast.
  await page.goto("/admin/ajustes?ok=ajustes");
  const toast = page.getByRole("status").filter({ hasText: "Ajustes guardados" });
  await expect(toast).toBeVisible();
  await toast.getByRole("button", { name: "Cerrar aviso" }).click();
  await expect(toast).toHaveCount(0);
});
