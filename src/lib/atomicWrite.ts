import fs from "fs";
import path from "path";

/**
 * Writes JSON data atomically: writes to a sibling .tmp file on the same
 * filesystem, then renames it over the target. POSIX rename() is atomic,
 * so readers always see either the old file or the new file — never a
 * partial write. Safe against process crashes mid-write.
 */
export function atomicWriteJSON(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmp = path.join(dir, `.${base}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}
