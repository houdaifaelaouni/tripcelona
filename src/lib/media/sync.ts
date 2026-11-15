import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  MAX_EDGE,
  legacyDownloadUrl,
  placeholderAlt,
  targetPaths,
  type MediaReport,
} from "./pipeline";

type Db = SupabaseClient<Database>;

async function existsInStorage(db: Db, bucket: string, path: string): Promise<boolean> {
  const dir = path.split("/").slice(0, -1).join("/");
  const name = path.split("/").pop()!;
  const { data } = await db.storage.from(bucket).list(dir, { search: name, limit: 10 });
  return Boolean(data?.some((f) => f.name === name));
}

async function download(sourceUrl: string): Promise<Buffer> {
  const res = await fetch(legacyDownloadUrl(sourceUrl), { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`download ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export type SyncOptions = {
  dryRun?: boolean;
  force?: boolean;
  limit?: number;
  /** Stop starting new files after this time (ms since epoch); the rest stay pending. */
  deadline?: number;
  /** Only rows not copied yet (width is null). The admin button uses this. */
  pendingOnly?: boolean;
  loadOriginal?: (sourceUrl: string) => Promise<Buffer>;
};

/**
 * Media pipeline (US-30): legacy originals -> max 2000 px -> WebP + AVIF ->
 * Supabase Storage at stable paths, then the media row points at the WebP.
 * Idempotent. Used by `pnpm media:sync` and Admin -> Medios.
 */
export async function syncLegacyMedia(db: Db, opts: SyncOptions = {}): Promise<MediaReport> {
  const loadOriginal = opts.loadOriginal ?? download;
  let query = db
    .from("media")
    .select("id, bucket, path, alt, source_url")
    .not("source_url", "is", null)
    .order("path");
  if (opts.pendingOnly) query = query.is("width", null);
  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);

  const report: MediaReport = { processed: [], skipped: [], failed: [] };
  for (const row of rows.slice(0, opts.limit ?? Infinity)) {
    if (opts.deadline && Date.now() > opts.deadline) break;
    const target = targetPaths(row.path);
    try {
      if (
        !opts.force &&
        row.path === target.webp &&
        (await existsInStorage(db, row.bucket, target.webp)) &&
        (await existsInStorage(db, row.bucket, target.avif))
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

      if (!opts.dryRun) {
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
  return report;
}

/** Legacy images not copied into Storage yet (the pipeline sets width). */
export async function pendingLegacyMedia(db: Db): Promise<number> {
  const { count } = await db
    .from("media")
    .select("id", { count: "exact", head: true })
    .not("source_url", "is", null)
    .is("width", null);
  return count ?? 0;
}
