/**
 * Standalone maintenance script — deletes files in public/uploads that no longer have any
 * database reference (an image was removed or replaced somewhere, so the old file was left
 * orphaned on disk). Safe to run repeatedly; files uploaded in the last 24 hours are always
 * skipped regardless of reference status, in case they're part of an unsaved admin form.
 *
 * Run manually:
 *   npx ts-node -P tsconfig.seed.json scripts/cleanup-uploads.ts
 *
 * Run via cron (see DEPLOY.md for the full crontab line) — logs a one-line summary to stdout,
 * suitable for redirecting to a log file.
 */
import dotenv from "dotenv";
dotenv.config();

import { cleanupOrphanedUploads } from "../lib/uploadsCleanup";

async function main() {
  const result = await cleanupOrphanedUploads({ dryRun: false });
  const freedMB = (result.freedBytes / 1024 / 1024).toFixed(2);
  console.log(
    `[cleanup-uploads] ${new Date().toISOString()} — scanned ${result.totalFiles} files, ` +
    `deleted ${result.deleted.length} (${freedMB} MB freed), skipped ${result.skippedTooRecent} too-recent.`
  );
  if (result.deleted.length > 0) {
    console.log(`[cleanup-uploads] deleted: ${result.deleted.join(", ")}`);
  }
}

main()
  .catch((err) => {
    console.error("[cleanup-uploads] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
