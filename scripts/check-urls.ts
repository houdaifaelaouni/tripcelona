/**
 * URL crawl (US-33): every old URL in migration/urls.csv must answer 200, or
 * 301 in one hop to a page that answers 200. Also checks every sitemap URL
 * and that unknown paths are real 404s.
 *
 *   pnpm check:urls --base https://tripcelona.com
 *   pnpm check:urls --base http://localhost:3000 --allow-missing-content   # CI
 *
 * --allow-missing-content: a 404 on a blog post or CMS page target is a
 *   warning, for databases without the imported copy (CI runs on the seed).
 * --strict-pending: rows marked `pending` (waiting on the owner) fail too.
 *   Use it for the go/no-go run on production.
 */
import { readFileSync } from "node:fs";
import { parseInventory } from "../src/lib/seo/url-inventory";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const base = (args[args.indexOf("--base") + 1] ?? "").replace(/\/$/, "");
if (!args.includes("--base") || !base) {
  console.error("Usage: pnpm check:urls --base <url> [--allow-missing-content] [--strict-pending]");
  process.exit(2);
}

type Result = { level: "ok" | "warn" | "fail"; line: string };
const results: Result[] = [];
const ok = (line: string) => results.push({ level: "ok", line });
const warn = (line: string) => results.push({ level: "warn", line });
const fail = (line: string) => results.push({ level: "fail", line });

async function head(path: string) {
  const res = await fetch(base + path, { redirect: "manual" });
  await res.body?.cancel();
  const loc = res.headers.get("location");
  return { status: res.status, location: loc ? new URL(loc, base).pathname : null };
}

const isContent = (p: string) =>
  p.startsWith("/blog/") || (/^\/[^/]+$/.test(p) && !p.includes("."));

async function expect200(label: string, path: string) {
  const r = await head(path);
  if (r.status === 200) return true;
  if (r.status === 404 && flag("allow-missing-content") && isContent(path)) {
    warn(`${label}: ${path} is 404 (no imported content in this database)`);
    return false;
  }
  fail(
    `${label}: ${path} answered ${r.status}${r.location ? ` → ${r.location}` : ""}, expected 200`,
  );
  return false;
}

async function checkInventory() {
  const rows = parseInventory(readFileSync("migration/urls.csv", "utf8"));
  for (const row of rows) {
    if (row.path.includes("*")) {
      // Wildcard rows: probe one representative path.
      const sample = row.path.replace("*", row.action === "retire" ? "index.php" : "2020/01/x.jpg");
      const r = await head(sample);
      const want = row.action === "retire" ? [410] : [301, 404];
      if (want.includes(r.status)) ok(`${row.path} (${sample}) ${r.status}`);
      else fail(`${row.path} (${sample}) answered ${r.status}, expected ${want.join(" or ")}`);
      continue;
    }
    const r = await head(row.path);
    if (row.action === "retire") {
      if (r.status === 410 || r.status === 404) ok(`${row.path} retired (${r.status})`);
      else fail(`${row.path} answered ${r.status}, expected 410`);
      continue;
    }
    if (row.action === "pending") {
      const final = r.status === 301 && r.location ? (await head(r.location)).status : r.status;
      const msg = `${row.path} is pending (answers ${final}): ${row.notes}`;
      if (flag("strict-pending") && final !== 200) fail(msg);
      else warn(msg);
      continue;
    }
    if (r.status === 200 && row.path === row.newPath) {
      ok(`${row.path} 200`);
    } else if (r.status === 301 && r.location === row.newPath) {
      if (await expect200(row.path, row.newPath)) ok(`${row.path} 301 → ${row.newPath} 200`);
    } else {
      fail(
        `${row.path} answered ${r.status}${r.location ? ` → ${r.location}` : ""}, expected ${
          row.path === row.newPath ? "200" : `301 → ${row.newPath}`
        }`,
      );
    }
  }
}

async function checkSitemap() {
  const res = await fetch(`${base}/sitemap.xml`);
  if (!res.ok) return fail(`/sitemap.xml answered ${res.status}`);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  for (const p of locs) if (await expect200("sitemap", p)) ok(`sitemap ${p} 200`);
}

async function checkNotFound() {
  for (const p of [
    "/esta-pagina-no-existe",
    "/blog/no-existe",
    "/excursiones/no-existe",
    "/a/b/c",
  ]) {
    const r = await head(p);
    if (r.status === 404) ok(`${p} 404`);
    else fail(`${p} answered ${r.status}, expected 404`);
  }
}

async function main() {
  await checkInventory();
  await checkSitemap();
  await checkNotFound();
  report();
}

function report() {
  const icon = { ok: "✓", warn: "!", fail: "✗" };
  for (const r of results)
    if (r.level !== "ok" || flag("verbose")) console.log(icon[r.level], r.line);
  const count = (l: Result["level"]) => results.filter((r) => r.level === l).length;
  console.log(
    `\n${count("ok")} ok, ${count("warn")} warnings, ${count("fail")} failures (${base})`,
  );
  process.exit(count("fail") ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
