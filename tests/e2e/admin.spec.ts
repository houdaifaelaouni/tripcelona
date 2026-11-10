import { expect, test } from "@playwright/test";
import { E2E } from "./constants";

test("owner signs in and publishes a blog post", async ({ page }) => {
  const csp: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text());
  });
  await page.goto("/admin");
  await page.waitForURL(/\/admin\/login/);
  await page.locator("input[name=email]").fill(E2E.ownerEmail);
  await page.locator("input[name=password]").fill(E2E.ownerPassword);
  await page.locator("button[type=submit]").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/admin/login"));

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
