/**
 * Incident-triage script — lists every database record that points at an /uploads/* file
 * which is NOT present on disk. Read-only: makes no changes to the database or filesystem.
 *
 * Use this after something has deleted real upload files out from under the database
 * (e.g. an rsync run without --exclude public/uploads) to know exactly what needs
 * re-uploading through the admin panel.
 *
 * Run manually on the server (must run where the real public/uploads directory lives):
 *   npx ts-node -P tsconfig.seed.json scripts/report-missing-uploads.ts
 */
import dotenv from "dotenv";
dotenv.config();

import { findMissingUploads } from "../lib/uploadsCleanup";

async function main() {
  const missing = await findMissingUploads();

  if (missing.length === 0) {
    console.log("[report-missing-uploads] no missing files — every DB image reference resolves to a file on disk.");
    return;
  }

  const totalRefs = missing.reduce((sum, m) => sum + m.references.length, 0);
  console.log(`[report-missing-uploads] ${missing.length} missing file(s), ${totalRefs} affected record(s):\n`);

  for (const m of missing) {
    console.log(`  ${m.filename}`);
    for (const ref of m.references) {
      console.log(`    - ${ref}`);
    }
  }
}

main()
  .catch((err) => {
    console.error("[report-missing-uploads] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
