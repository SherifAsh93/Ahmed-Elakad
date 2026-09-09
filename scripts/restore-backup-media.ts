/**
 * One-time restore: uploads every file in backup/images/ (a recovered dump
 * of the legacy VPS media folder) to Cloudinary under
 * `${CLOUDINARY_FOLDER}/media-migrated`, using the original legacy filename
 * (sans extension) as the public_id. This both (a) populates the admin
 * Media Library, since GET /api/images searches this Cloudinary folder, and
 * (b) gives every legacy `ahmedelakad.com/media/<filename>` reference a
 * deterministic, addressable Cloudinary counterpart for repointing.
 *
 * Resumable: results are appended to scripts/.restore-media-results.jsonl
 * as they complete, and already-recorded filenames are skipped on rerun.
 * `overwrite: false` also makes re-uploading a given public_id a no-op
 * against Cloudinary itself.
 *
 * Usage: npx tsx scripts/restore-backup-media.ts
 */
import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

// NOTE: src/lib/cloudinary.ts calls cloudinary.config() at module load time,
// which (due to ESM import hoisting) would run before dotenv populates
// process.env if imported here. Configure explicitly, after dotenv, instead.
config({ path: path.join(process.cwd(), ".env.local") });
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const BACKUP_DIR = path.join(process.cwd(), "backup", "images");
const RESULTS_PATH = path.join(process.cwd(), "scripts", ".restore-media-results.jsonl");
const FOLDER = `${process.env.CLOUDINARY_FOLDER ?? "Ahmed Elakad"}/media-migrated`;
const CONCURRENCY = 12;

const VIDEO_EXTS = new Set([".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v"]);
const VALID_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v"]);

type Result = { filename: string; ok: boolean; url?: string; error?: string };

function loadExisting(): Map<string, Result> {
  const map = new Map<string, Result>();
  if (!fs.existsSync(RESULTS_PATH)) return map;
  const lines = fs.readFileSync(RESULTS_PATH, "utf-8").split("\n").filter(Boolean);
  for (const line of lines) {
    try {
      const r: Result = JSON.parse(line);
      map.set(r.filename, r);
    } catch {}
  }
  return map;
}

function appendResult(r: Result) {
  fs.appendFileSync(RESULTS_PATH, JSON.stringify(r) + "\n");
}

async function uploadOne(filename: string): Promise<Result> {
  const ext = path.extname(filename).toLowerCase();
  const base = filename.slice(0, -ext.length);
  const resourceType = VIDEO_EXTS.has(ext) ? "video" : "image";
  const filePath = path.join(BACKUP_DIR, filename);

  try {
    const res = await cloudinary.uploader.upload(filePath, {
      public_id: base,
      folder: FOLDER,
      resource_type: resourceType,
      overwrite: false,
      unique_filename: false,
    });
    return { filename, ok: true, url: res.secure_url };
  } catch (e) {
    return { filename, ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function main() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_SECRET) {
    console.error("Missing CLOUDINARY_* env vars.");
    process.exit(1);
  }

  const allFiles = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => VALID_EXTS.has(path.extname(f).toLowerCase()));

  const existing = loadExisting();
  const pending = allFiles.filter((f) => !existing.has(f));

  console.log(`Total files: ${allFiles.length}. Already done: ${existing.size}. Pending: ${pending.length}.`);

  let completed = 0;
  let failed = 0;
  let idx = 0;

  async function worker() {
    while (idx < pending.length) {
      const filename = pending[idx++];
      const result = await uploadOne(filename);
      appendResult(result);
      if (result.ok) completed++;
      else { failed++; console.error(`FAILED: ${filename}: ${result.error}`); }
      const done = completed + failed;
      if (done % 100 === 0) {
        console.log(`Progress: ${done}/${pending.length} (${completed} ok, ${failed} failed)`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log(`Done. This run: ${completed} uploaded, ${failed} failed.`);
  console.log(`Total recorded: ${existing.size + completed}/${allFiles.length}.`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
