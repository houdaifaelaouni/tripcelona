/**
 * Media pipeline (US-30): legacy originals -> max 2000 px -> WebP + AVIF ->
 * Supabase Storage at stable paths. Idempotent: files already in Storage are
 * skipped unless --force. Reports skipped and failed files; exits 1 on failure.
 *
 *   pnpm media:sync [--dry-run] [--force] [--limit N] [--source-dir DIR]
 *
 * --source-dir reads originals from a local folder (matched by file name)
 * instead of downloading `media.source_url`, e.g. a WordPress uploads export.
 * Once the run is clean, set MEDIA_FROM_STORAGE=true so the site serves them.
 * After the DNS cutover, set LEGACY_WP_ORIGIN to the old WordPress host.
 * The owner can run the same copy from Admin -> Medios.
 */
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { syncLegacyMedia } from "@/lib/media/sync";
import { createAdminClient } from "@/lib/supabase/admin";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const dryRun = flag("--dry-run");
const sourceDir = option("--source-dir");

async function main() {
  const report = await syncLegacyMedia(createAdminClient(), {
    dryRun,
    force: flag("--force"),
    limit: Number(option("--limit") ?? Infinity),
    loadOriginal: sourceDir
      ? (url) => readFile(join(sourceDir, basename(new URL(url).pathname)))
      : undefined,
  });
  console.log(JSON.stringify(report, null, 2));
  console.log(
    `${dryRun ? "[dry run] " : ""}processed ${report.processed.length}, skipped ${report.skipped.length}, failed ${report.failed.length}`,
  );
  if (report.failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
