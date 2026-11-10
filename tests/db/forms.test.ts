// Public forms store the submission even when email fails (US-34, FR-41, FR-72).
import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { connectLocalSupabase, waitForSupabaseApi } from "./local-env";

let ip = "203.0.113.1";
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": ip }),
}));

connectLocalSupabase();
await waitForSupabaseApi();
const { createAdminClient } = await import("@/lib/supabase/admin");
const { submitContact, submitQuote } = await import("@/lib/forms/actions");

const db = createAdminClient();
const tag = randomUUID().slice(0, 8);
const email = (k: string) => `forms-${tag}-${k}@example.com`;

function fd(values: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.append(k, v);
  return f;
}
const contact = (k: string, extra: Record<string, string> = {}) =>
  fd({
    name: "Prueba",
    email: email(k),
    message: "Hola, quiero información sobre grupos.",
    privacy: "on",
    ...extra,
  });

beforeEach(() => {
  ip = `203.0.113.${Math.floor(Math.random() * 250) + 1}-${randomUUID()}`;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

afterAll(async () => {
  await db.from("leads").delete().like("payload->>email", `forms-${tag}-%`);
  await db.from("tour_requests").delete().like("email", `forms-${tag}-%`);
});

async function lead(k: string) {
  const { data } = await db
    .from("leads")
    .select("source, payload, notified_at, email_error")
    .eq("payload->>email", email(k));
  return data ?? [];
}

describe("contact form", () => {
  it("stores the message and records the email error when OWNER_EMAIL is missing", async () => {
    vi.stubEnv("OWNER_EMAIL", "");
    vi.stubEnv("RESEND_API_KEY", "");
    const res = await submitContact({ status: "idle" }, contact("noowner"));
    expect(res.status).toBe("ok");
    const rows = await lead("noowner");
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe("contact");
    expect(rows[0].email_error).toMatch(/OWNER_EMAIL/);
    expect(rows[0].notified_at).toBeNull();
  });

  it("stores the message when the email provider fails", async () => {
    vi.stubEnv("OWNER_EMAIL", "owner@example.com");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Tripcelona <hola@example.com>");
    const realFetch = globalThis.fetch;
    vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) =>
      String(input).startsWith("https://api.resend.com")
        ? Promise.resolve(new Response("down", { status: 500 }))
        : realFetch(input, init),
    );
    const res = await submitContact({ status: "idle" }, contact("resend"));
    expect(res.status).toBe("ok");
    const rows = await lead("resend");
    expect(rows).toHaveLength(1);
    expect(rows[0].email_error).toMatch(/Resend 500/);
  });

  it("marks the message notified when both emails go out", async () => {
    vi.stubEnv("OWNER_EMAIL", "owner@example.com");
    vi.stubEnv("RESEND_API_KEY", "");
    const res = await submitContact({ status: "idle" }, contact("sent"));
    expect(res.status).toBe("ok");
    const rows = await lead("sent");
    expect(rows[0].notified_at).not.toBeNull();
    expect(rows[0].email_error).toBeNull();
  });

  it("answers bots with a silent ok and stores nothing", async () => {
    const res = await submitContact({ status: "idle" }, contact("bot", { website: "http://spam" }));
    expect(res.status).toBe("ok");
    expect(await lead("bot")).toHaveLength(0);
  });

  it("rejects a submission without privacy consent", async () => {
    const f = contact("noconsent");
    f.delete("privacy");
    const res = await submitContact({ status: "idle" }, f);
    expect(res.status).toBe("error");
    if (res.status === "error") expect(res.fieldErrors.privacy).toBeTruthy();
    expect(await lead("noconsent")).toHaveLength(0);
  });

  it("blocks the sixth submission from the same client within ten minutes", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const results = [];
    for (let i = 0; i < 6; i++) {
      results.push((await submitContact({ status: "idle" }, contact("burst"))).status);
    }
    expect(results).toEqual(["ok", "ok", "ok", "ok", "ok", "error"]);
    expect(await lead("burst")).toHaveLength(5);
  });
});

describe("quote form", () => {
  it("stores a custom-destination request even when email fails", async () => {
    vi.stubEnv("OWNER_EMAIL", "");
    vi.stubEnv("RESEND_API_KEY", "");
    const res = await submitQuote(
      { status: "idle" },
      fd({
        tour: "a-medida",
        dates: "Primavera",
        groupSize: "12",
        extras: "Guía",
        name: "Grupo",
        email: email("quote"),
        phone: "600000000",
        privacy: "on",
      }),
    );
    expect(res.status).toBe("ok");
    const { data } = await db
      .from("tour_requests")
      .select("group_size, tour_id, extras, privacy_accepted_at, email_error")
      .eq("email", email("quote"));
    expect(data).toHaveLength(1);
    expect(data![0]).toMatchObject({ group_size: 12, tour_id: null, extras: ["Guía"] });
    expect(data![0].privacy_accepted_at).not.toBeNull();
    expect(data![0].email_error).toMatch(/OWNER_EMAIL/);
  });

  it("rejects an excursion that is not published", async () => {
    const res = await submitQuote(
      { status: "idle" },
      fd({
        tour: `no-existe-${tag}`,
        dates: "Mayo",
        groupSize: "8",
        name: "Grupo",
        email: email("badtour"),
        phone: "600000000",
        privacy: "on",
      }),
    );
    expect(res.status).toBe("error");
    if (res.status === "error") expect(res.fieldErrors.tour).toBeTruthy();
  });
});
