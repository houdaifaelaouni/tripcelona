import { defineConfig, devices } from "@playwright/test";
import { connectLocalSupabase } from "./tests/db/local-env";

connectLocalSupabase();

/**
 * End-to-end suite (US-35). Runs against `next start` on a production build
 * and a local Supabase stack prepared by `pnpm e2e:prepare`. Payments go to
 * the fake gateway in tests/e2e/fake-redsys.mjs, signed with the public
 * Redsys sandbox key; the live card test is a launch-runbook step.
 */
// Must match NEXT_PUBLIC_SITE_URL at build time: Redsys notifications go there.
const PORT = Number(
  new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").port || 3000,
);
const REDSYS_PORT = 4010;
const base = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: base, trace: "off", locale: "es-ES", timezoneId: "Europe/Madrid" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: [
    {
      command: `node tests/e2e/fake-redsys.mjs`,
      env: { PORT: String(REDSYS_PORT) },
      port: REDSYS_PORT,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm start -p ${PORT}`,
      url: `${base}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        NEXT_PUBLIC_SITE_URL: base,
        OWNER_EMAIL: "owner@example.com",
        REDSYS_MERCHANT_CODE: "999008881",
        REDSYS_TERMINAL: "1",
        REDSYS_SECRET_KEY: "sq7HjrUOBfKmC576ILgskD5srU870gJ7",
        REDSYS_ENV: "test",
        REDSYS_BASE_URL: `http://localhost:${REDSYS_PORT}`,
        RESEND_API_KEY: "",
      },
    },
  ],
});
