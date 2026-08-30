import { prisma } from "./prisma";
import { readdir, unlink, stat } from "fs/promises";
import path from "path";
import type { HomepageContent } from "./homepage-content";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Files newer than this are never considered for deletion, even if nothing references them yet —
// an admin may have just uploaded an image into a form they haven't saved yet (e.g. mid-way
// through adding an event's promo gallery), and a cron run in that window must not delete it out
// from under them.
const MIN_AGE_HOURS = 24;

function extractFilename(value: unknown, refs: Set<string>) {
  if (typeof value !== "string") return;
  const match = value.match(/\/uploads\/([^"'\s?]+)/);
  if (match) refs.add(match[1]);
}

/** Every local /uploads/* filename currently referenced anywhere in the database, across every association. */
async function collectReferencedFilenames(): Promise<Set<string>> {
  const refs = new Set<string>();

  const associations = await prisma.association.findMany({ select: { logo: true, homepageContent: true } });
  for (const a of associations) {
    extractFilename(a.logo, refs);
    const hc = a.homepageContent as HomepageContent | null;
    if (hc) {
      extractFilename(hc.aboutImage, refs);
      for (const slide of hc.heroSlides ?? []) extractFilename(slide.image, refs);
    }
  }

  const members = await prisma.member.findMany({ select: { image: true } });
  for (const m of members) extractFilename(m.image, refs);

  const events = await prisma.event.findMany({ select: { image: true, promoImages: true, recapImages: true } });
  for (const e of events) {
    extractFilename(e.image, refs);
    for (const img of e.promoImages) extractFilename(img, refs);
    for (const img of e.recapImages) extractFilename(img, refs);
  }

  const news = await prisma.news.findMany({ select: { image: true } });
  for (const n of news) extractFilename(n.image, refs);

  const committee = await prisma.committeeMember.findMany({ select: { image: true } });
  for (const c of committee) extractFilename(c.image, refs);

  // Generic KV settings — favicon_image, default_member_image, hero_image, and any future
  // image-holding key all land here; scanning every value is simpler and more future-proof
  // than hardcoding specific keys.
  const settings = await prisma.siteSettings.findMany({ select: { value: true } });
  for (const s of settings) extractFilename(s.value, refs);

  return refs;
}

export interface UploadsCleanupResult {
  deleted: string[];
  freedBytes: number;
  totalFiles: number;
  skippedTooRecent: number;
}

export async function cleanupOrphanedUploads(opts: { dryRun?: boolean } = {}): Promise<UploadsCleanupResult> {
  const referenced = await collectReferencedFilenames();

  let filenames: string[];
  try {
    filenames = await readdir(UPLOADS_DIR);
  } catch {
    return { deleted: [], freedBytes: 0, totalFiles: 0, skippedTooRecent: 0 };
  }

  const cutoff = Date.now() - MIN_AGE_HOURS * 60 * 60 * 1000;
  const deleted: string[] = [];
  let freedBytes = 0;
  let skippedTooRecent = 0;

  for (const filename of filenames) {
    if (referenced.has(filename)) continue;

    const filepath = path.join(UPLOADS_DIR, filename);
    let fileStat;
    try {
      fileStat = await stat(filepath);
    } catch {
      continue; // vanished mid-scan
    }
    if (!fileStat.isFile()) continue; // never touch subdirectories

    if (fileStat.mtimeMs > cutoff) {
      skippedTooRecent++;
      continue;
    }

    if (!opts.dryRun) {
      try {
        await unlink(filepath);
      } catch {
        continue;
      }
    }
    deleted.push(filename);
    freedBytes += fileStat.size;
  }

  return { deleted, freedBytes, totalFiles: filenames.length, skippedTooRecent };
}
