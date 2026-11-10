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
 */
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import sharp from "sharp";
import { MAX_EDGE, placeholderAlt, targetPaths, type MediaReport } from "@/lib/media/pipeline";
import { createAdminClient } from "@/lib/supabase/admin";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const dryRun = flag("--dry-run");
const force = flag("--force");
const limit = Number(option("--limit") ?? Infinity);
const sourceDir = option("--source-dir");

const db = createAdminClient();

async function existsInStorage(bucket: string, path: string): Promise<boolean> {
  const dir = path.split("/").slice(0, -1).join("/");
  const name = path.split("/").pop()!;
  const { data } = await db.storage.from(bucket).list(dir, { search: name, limit: 10 });
  return Boolean(data?.some((f) => f.name === name));
}

async function loadOriginal(sourceUrl: string): Promise<Buffer> {
  if (sourceDir) return readFile(join(sourceDir, basename(new URL(sourceUrl).pathname)));
  const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`download ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const { data: rows, error } = await db
    .from("media")
    .select("id, bucket, path, alt, source_url")
    .not("source_url", "is", null)
    .order("path");
  if (error) throw new Error(error.message);

  const report: MediaReport = { processed: [], skipped: [], failed: [] };
  for (const row of rows.slice(0, limit)) {
    const target = targetPaths(row.path);
    try {
      if (
        !force &&
        row.path === target.webp &&
        (await existsInStorage(row.bucket, target.webp)) &&
        (await existsInStorage(row.bucket, target.avif))
      ) {
        report.skipped.push(row.path);
        continue;
      }
      const original = await loadOriginal(row.source_url!);
      const resized = sharp(original, { failOn: "error" })
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true });
      const webp = await resized
        .clone()
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });
      const avif = await resized.clone().avif({ quality: 55 }).toBuffer();

      if (!dryRun) {
        for (const [path, body, type] of [
          [target.webp, webp.data, "image/webp"],
          [target.avif, avif, "image/avif"],
        ] as const) {
          const { error: upErr } = await db.storage
            .from(row.bucket)
            .upload(path, body, { contentType: type, upsert: true, cacheControl: "31536000" });
          if (upErr) throw new Error(`upload ${path}: ${upErr.message}`);
        }
        const { error: rowErr } = await db
          .from("media")
          .update({
            path: target.webp,
            mime: "image/webp",
            width: webp.info.width,
            height: webp.info.height,
            size_bytes: webp.data.length,
            alt: row.alt ?? placeholderAlt(row.path),
          })
          .eq("id", row.id);
        if (rowErr) throw new Error(`media row: ${rowErr.message}`);
      }
      report.processed.push(`${target.webp} (${webp.info.width}x${webp.info.height})`);
    } catch (err) {
      report.failed.push({ path: row.path, error: (err as Error).message });
    }
  }

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
