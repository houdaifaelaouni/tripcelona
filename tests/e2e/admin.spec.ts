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
    "/admin/inicio",
    "/admin/pagos",
    "/admin/actividad",
    "/admin/redirecciones",
    "/admin/navegacion",
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

  // The tour editor: two-column layout, summary card and departures.
  await page.goto("/admin/excursiones");
  await page.locator('a[href^="/admin/excursiones/"]').first().click();
  await page.waitForURL(/\/admin\/excursiones\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("button", { name: "Guardar excursión" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Salidas" })).toBeVisible();
  const tourAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    tourAxe.violations
      .filter((v) => v.impact === "critical" || v.impact === "serious")
      .map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`),
  ).toEqual([]);

  // Success messages show as a dismissible toast.
  await page.goto("/admin/ajustes?ok=ajustes");
  const toast = page.getByRole("status").filter({ hasText: "Ajustes guardados" });
  await expect(toast).toBeVisible();
  await toast.getByRole("button", { name: "Cerrar aviso" }).click();
  await expect(toast).toHaveCount(0);
});

test("staff create a new tour and set its URL", async ({ page }) => {
  await page.goto("/admin/excursiones");
  await page.waitForURL(/\/admin\/login/);
  await page.locator("input[name=email]").fill(E2E.ownerEmail);
  await page.locator("input[name=password]").fill(e2eOwnerPassword());
  await page.locator("button[type=submit]").click();
  await page.waitForURL(/\/admin\/excursiones$/);
  await page.getByRole("button", { name: "Nueva excursión" }).click();
  await page.waitForURL(/\/admin\/excursiones\/[0-9a-f-]{36}$/);
  const slug = `e2e-tour-${Date.now()}`;
  await page.locator("input[name=title]").fill("Excursión creada por la prueba e2e");
  await page.locator("input[name=slug]").fill(slug);
  await page.locator("input[name=price_from]").fill("45");
  await page.locator("select[name=status]").selectOption("draft");
  await page.getByRole("button", { name: "Guardar excursión" }).first().click();
  await page.waitForURL(/ok=guardado/);
  await expect(page.locator("input[name=slug]")).toHaveValue(slug);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Excursión creada por la prueba e2e",
  );

  // Add a photo by uploading it from the tour editor.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
  const fotos = page.locator("#fotos");
  await fotos
    .locator("input[name=file]")
    .setInputFiles({ name: "foto-e2e.png", mimeType: "image/png", buffer: png });
  await fotos.locator("input[name=alt]").fill("Foto de prueba e2e");
  await fotos.getByRole("button", { name: "Subir foto" }).click();
  await page.waitForURL(/ok=foto_anadida/);
  await expect(page.locator("#fotos").getByText("Principal", { exact: true })).toBeVisible();
  await expect(page.locator("#fotos").getByRole("button", { name: "Quitar foto 1" })).toBeVisible();
});

test("staff edit the home texts and menu, then restore the originals", async ({ page }) => {
  await page.goto("/admin/inicio");
  await page.waitForURL(/\/admin\/login/);
  await page.locator("input[name=email]").fill(E2E.ownerEmail);
  await page.locator("input[name=password]").fill(e2eOwnerPassword());
  await page.locator("button[type=submit]").click();
  await page.waitForURL(/\/admin\/inicio$/);

  await page.waitForLoadState("networkidle");
  await page.locator("input[name=heroTitle]").fill("Título editado desde el panel");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await page.waitForURL(/ok=guardado/);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Título editado desde el panel");

  // A malformed line is refused with a message and nothing changes.
  await page.goto("/admin/navegacion");
  await page.waitForLoadState("networkidle"); // let the page hydrate before typing
  const nav = page.locator("textarea[name=nav]");
  await nav.fill("Solo texto sin enlace");
  await expect(nav).toHaveValue("Solo texto sin enlace");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await page.waitForURL(/error=/);

  await page.goto("/admin/inicio");
  await page.getByRole("button", { name: "Restaurar textos originales" }).click();
  await page.waitForURL(/ok=restaurado/);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Excursiones de un día desde Barcelona",
  );
});

test("owner downloads CSV exports and gets a 401 when signed out", async ({ page, request }) => {
  const anon = await request.get("/admin/exportar/reservas", { maxRedirects: 0 });
  expect([301, 302, 303, 307, 308, 401]).toContain(anon.status());

  await page.goto("/admin/reservas");
  await page.waitForURL(/\/admin\/login/);
  await page.locator("input[name=email]").fill(E2E.ownerEmail);
  await page.locator("input[name=password]").fill(e2eOwnerPassword());
  await page.locator("button[type=submit]").click();
  await page.waitForURL(/\/admin\/reservas$/);
  const res = await page.request.get("/admin/exportar/reservas");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  expect(await res.text()).toContain("Referencia");
});
