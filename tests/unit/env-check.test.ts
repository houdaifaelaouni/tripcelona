import { describe, expect, it } from "vitest";
import { checkEnv } from "@/lib/ops/env-check";

const production = {
  NEXT_PUBLIC_SITE_URL: "https://tripcelona.com",
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
  REDSYS_MERCHANT_CODE: "123456789",
  REDSYS_TERMINAL: "1",
  REDSYS_SECRET_KEY: "secret",
  REDSYS_ENV: "live",
  RESEND_API_KEY: "re_x",
  EMAIL_FROM: "Tripcelona <reservas@example-sender.com>",
  OWNER_EMAIL: "owner@example.com",
  RATE_LIMIT_SALT: "x".repeat(40),
  MEDIA_FROM_STORAGE: "true",
  NEXT_PUBLIC_ALLOW_INDEXING: "true",
};

const names = (env: Record<string, string | undefined>, target: "production" | "preview") =>
  checkEnv(env, target)
    .filter((p) => p.level === "error")
    .map((p) => p.name);

describe("checkEnv", () => {
  it("accepts a complete production env", () => {
    expect(checkEnv(production, "production")).toEqual([]);
  });

  it("reports every missing required variable", () => {
    const errors = names({}, "production");
    expect(errors).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(errors).toContain("REDSYS_SECRET_KEY");
    expect(errors).toContain("OWNER_EMAIL");
  });

  it("blocks sandbox Redsys, test mode and a base URL override in production", () => {
    const errors = names(
      {
        ...production,
        REDSYS_ENV: "test",
        REDSYS_MERCHANT_CODE: "999008881",
        REDSYS_BASE_URL: "http://localhost:4010",
      },
      "production",
    );
    expect(errors).toEqual(
      expect.arrayContaining(["REDSYS_ENV", "REDSYS_MERCHANT_CODE", "REDSYS_BASE_URL"]),
    );
  });

  it("rejects local URLs, short salts and free-mail senders", () => {
    const errors = names(
      {
        ...production,
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        RATE_LIMIT_SALT: "short",
        EMAIL_FROM: "someone@gmail.com",
      },
      "production",
    );
    expect(errors).toEqual(
      expect.arrayContaining(["NEXT_PUBLIC_SUPABASE_URL", "RATE_LIMIT_SALT", "EMAIL_FROM"]),
    );
  });

  it("only warns about pre-launch flags in production", () => {
    const problems = checkEnv(
      { ...production, NEXT_PUBLIC_ALLOW_INDEXING: "false", MEDIA_FROM_STORAGE: "false" },
      "production",
    );
    expect(problems.every((p) => p.level === "warning")).toBe(true);
    expect(problems.map((p) => p.name)).toEqual([
      "NEXT_PUBLIC_ALLOW_INDEXING",
      "MEDIA_FROM_STORAGE",
    ]);
  });

  it("keeps previews on the test gateway and noindex", () => {
    const errors = names(production, "preview");
    expect(errors).toEqual(expect.arrayContaining(["REDSYS_ENV", "NEXT_PUBLIC_ALLOW_INDEXING"]));
    expect(
      names(
        {
          ...production,
          REDSYS_ENV: "test",
          NEXT_PUBLIC_ALLOW_INDEXING: "false",
          REDSYS_MERCHANT_CODE: "999008881",
        },
        "preview",
      ),
    ).toEqual([]);
  });

  it("never echoes values in messages", () => {
    const secret = "sk_live_should_not_leak";
    const problems = checkEnv({ ...production, REDSYS_ENV: secret }, "production");
    expect(JSON.stringify(problems)).not.toContain(secret);
  });
});
