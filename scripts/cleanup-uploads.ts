/**
 * Standalone maintenance script — two passes over public/uploads:
 *  1. Deletes files that no longer have any database reference (an image was removed or
 *     replaced somewhere, so the old file was left orphaned on disk).
 *  2. Merges byte-identical duplicate files down to one copy, repointing every referencing
 *     record to the survivor first. Only merges a group when every reference in it belongs to
 *     the same association — a file referenced identically by two different associations is
 *     left alone (logged, not touched), since merging would silently couple their records.
 *
 * Both passes are safe to run repeatedly; files uploaded in the last 24 hours are always
 * skipped, in case they're part of an unsaved admin form.
 *
 * Run manually:
 *   npx ts-node -P tsconfig.seed.json scripts/cleanup-uploads.ts
 *
 * Run via cron (see DEPLOY.md for the full crontab line) — logs a one-line summary to stdout,
 * suitable for redirecting to a log file.
 */
import dotenv from "dotenv";
dotenv.config();

import { cleanupOrphanedUploads, mergeDuplicateUploads } from "../lib/uploadsCleanup";

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

  const dedup = await mergeDuplicateUploads({ dryRun: false });
  const dedupFreedMB = (dedup.freedBytes / 1024 / 1024).toFixed(2);
  const mergedFileCount = dedup.merged.reduce((sum, g) => sum + g.merged.length, 0);
  console.log(
    `[cleanup-uploads] duplicates — merged ${mergedFileCount} file(s) across ${dedup.merged.length} group(s) ` +
    `(${dedupFreedMB} MB freed), skipped ${dedup.skippedCrossTenant.length} cross-association group(s), ` +
    `${dedup.skippedTooRecent} too-recent.`
  );
  for (const g of dedup.merged) {
    console.log(`[cleanup-uploads] kept ${g.canonical}, removed: ${g.merged.join(", ")} (${g.referencesRewritten} reference(s) repointed)`);
  }
  if (dedup.skippedCrossTenant.length > 0) {
    for (const g of dedup.skippedCrossTenant) {
      console.log(`[cleanup-uploads] skipped cross-association duplicate (${g.associationNames.join(", ")}): ${g.files.join(", ")}`);
    }
  }
}

main()
  .catch((err) => {
    console.error("[cleanup-uploads] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
