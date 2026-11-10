/**
 * pnpm check:env [production|preview]
 * Checks the current environment (e.g. after `vercel env pull .env.check`
 * and `node --env-file=.env.check`) against the launch runbook. Prints names
 * and problems only, never values. Exits 1 on any error.
 */
import { checkEnv, type EnvTarget } from "@/lib/ops/env-check";

function main() {
  const arg = process.argv[2] ?? "production";
  if (arg !== "production" && arg !== "preview") {
    console.error("usage: pnpm check:env [production|preview]");
    process.exit(64);
  }
  const target: EnvTarget = arg;
  const problems = checkEnv(process.env, target);
  const errors = problems.filter((p) => p.level === "error");
  for (const p of problems) {
    console.log(`${p.level === "error" ? "ERROR  " : "warning"} ${p.name}: ${p.message}`);
  }
  console.log(
    `\n${target}: ${errors.length} error(s), ${problems.length - errors.length} warning(s)`,
  );
  process.exit(errors.length ? 1 : 0);
}

main();
