/**
 * Validates a deployment's environment variables against the launch runbook
 * (docs/launch/runbook.md, "Production env vars"). Pure: takes the env object,
 * never prints values, only variable names and what is wrong with them.
 */
export type EnvTarget = "production" | "preview";

export interface EnvProblem {
  name: string;
  level: "error" | "warning";
  message: string;
}

const REDSYS_SANDBOX_MERCHANT = "999008881";

const REDSYS_REQUIRED = [
  "REDSYS_MERCHANT_CODE",
  "REDSYS_TERMINAL",
  "REDSYS_SECRET_KEY",
  "REDSYS_ENV",
] as const;

const PAYCOMET_REQUIRED = [
  "PAYCOMET_API_KEY",
  "PAYCOMET_TERMINAL",
  "PAYCOMET_CUSTOMER_CODE",
  "PAYCOMET_PASSWORD",
] as const;

const STRIPE_REQUIRED = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] as const;

const REQUIRED = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "OWNER_EMAIL",
  "RATE_LIMIT_SALT",
] as const;

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isLocal(value: string): boolean {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(value);
}

export function checkEnv(env: Record<string, string | undefined>, target: EnvTarget): EnvProblem[] {
  const problems: EnvProblem[] = [];
  const error = (name: string, message: string) => problems.push({ name, level: "error", message });
  const warn = (name: string, message: string) =>
    problems.push({ name, level: "warning", message });
  const get = (name: string) => env[name]?.trim() ?? "";

  for (const name of REQUIRED) {
    if (!get(name)) error(name, "missing");
  }

  // The card gateway: Redsys unless PAYMENT_PROVIDER=paycomet or stripe.
  const provider = get("PAYMENT_PROVIDER") || "redsys";
  if (provider !== "redsys" && provider !== "paycomet" && provider !== "stripe") {
    error("PAYMENT_PROVIDER", "must be 'redsys', 'paycomet' or 'stripe'");
  }
  const required =
    provider === "stripe"
      ? STRIPE_REQUIRED
      : provider === "paycomet"
        ? PAYCOMET_REQUIRED
        : REDSYS_REQUIRED;
  for (const name of required) {
    if (!get(name)) error(name, "missing");
  }
  if (provider === "stripe") {
    const key = get("STRIPE_SECRET_KEY");
    if (key && !/^(sk|rk)_(live|test)_/.test(key))
      error(
        "STRIPE_SECRET_KEY",
        "must be a secret key (sk_… or rk_…), not the publishable pk_… key",
      );
  }

  for (const name of ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
    const value = get(name);
    if (!value) continue;
    if (!isHttpsUrl(value)) error(name, "must be an https URL");
    else if (isLocal(value)) error(name, "points at a local address");
  }
  const site = get("NEXT_PUBLIC_SITE_URL");
  if (site.endsWith("/")) warn("NEXT_PUBLIC_SITE_URL", "drop the trailing slash");

  const salt = get("RATE_LIMIT_SALT");
  if (salt && salt.length < 32) error("RATE_LIMIT_SALT", "use at least 32 random characters");

  const email = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  const owner = get("OWNER_EMAIL");
  if (owner && !email.test(owner)) error("OWNER_EMAIL", "is not an email address");
  const from = get("EMAIL_FROM");
  const fromAddress = from.match(/<([^>]+)>/)?.[1] ?? from;
  if (from && !email.test(fromAddress))
    error("EMAIL_FROM", "is not an email address or 'Name <email>'");
  if (/@(gmail|hotmail|outlook|yahoo)\./i.test(fromAddress) || /resend\.dev$/i.test(fromAddress)) {
    error("EMAIL_FROM", "must be on the verified sender domain (D7)");
  }

  const media = get("MEDIA_FROM_STORAGE");
  if (media && media !== "true" && media !== "false") {
    error("MEDIA_FROM_STORAGE", "must be 'true' or 'false'");
  }
  const indexing = get("NEXT_PUBLIC_ALLOW_INDEXING");
  if (indexing && indexing !== "true" && indexing !== "false") {
    error("NEXT_PUBLIC_ALLOW_INDEXING", "must be 'true' or 'false'");
  }

  const redsysEnv = get("REDSYS_ENV");
  if (redsysEnv && redsysEnv !== "live" && redsysEnv !== "test") {
    error("REDSYS_ENV", "must be 'live' or 'test'");
  }
  const sandboxMerchant = get("REDSYS_MERCHANT_CODE") === REDSYS_SANDBOX_MERCHANT;

  if (target === "production") {
    if (redsysEnv && redsysEnv !== "live") error("REDSYS_ENV", "must be 'live' in production");
    if (sandboxMerchant) error("REDSYS_MERCHANT_CODE", "is the public sandbox merchant");
    if (get("REDSYS_BASE_URL")) error("REDSYS_BASE_URL", "must not be set in production");
    if (get("PAYCOMET_BASE_URL")) error("PAYCOMET_BASE_URL", "must not be set in production");
    if (site && !/^https:\/\/(www\.)?tripcelona\.com$/.test(site.replace(/\/$/, ""))) {
      warn(
        "NEXT_PUBLIC_SITE_URL",
        "is not the tripcelona.com domain (fine only before DNS cutover)",
      );
    }
    if (indexing !== "true") {
      warn(
        "NEXT_PUBLIC_ALLOW_INDEXING",
        "is not 'true': search engines are blocked (correct until T-0)",
      );
    }
    if (media !== "true") {
      warn("MEDIA_FROM_STORAGE", "is not 'true': images still load from WordPress");
    }
  } else {
    if (redsysEnv === "live") error("REDSYS_ENV", "previews must use the Redsys test gateway");
    if (indexing === "true") error("NEXT_PUBLIC_ALLOW_INDEXING", "previews must stay noindex");
  }

  return problems;
}
