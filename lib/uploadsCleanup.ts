import { prisma } from "./prisma";
import { readdir, unlink, stat } from "fs/promises";
import { createReadStream } from "fs";
import { createHash } from "crypto";
import path from "path";
import type { Prisma } from "@prisma/client";
import type { HomepageContent } from "./homepage-content";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Files newer than this are never considered for deletion, even if nothing references them yet —
// an admin may have just uploaded an image into a form they haven't saved yet (e.g. mid-way
// through adding an event's promo gallery), and a cron run in that window must not delete it out
// from under them. Duplicate merging uses the same grace period for the same reason.
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

// ─────────────────────────────────────────────────────────────────────────
// Duplicate detection + merging
//
// Two uploads can end up byte-identical (same photo uploaded twice for different
// fields, or re-uploaded after a form reset) without either one being "unused" —
// both are genuinely referenced, just by more files than necessary. Merging means:
// pick one file as canonical, rewrite every DB record pointing at the other
// duplicate(s) to point at the canonical file instead, then delete the now-unused
// duplicate(s). That's a live write across every image-holding table, so unlike
// the orphan cleanup above it needs a per-reference "how do I rewrite this exact
// occurrence" closure, not just a Set of filenames.
// ─────────────────────────────────────────────────────────────────────────

interface FileReference {
  /** Association(s) this occurrence belongs to — a Member can belong to several via MemberAssociation. */
  associationIds: string[];
  describe: string;
  rewrite: (newFilename: string) => Promise<void>;
}

function filenameOf(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/\/uploads\/([^"'\s?]+)/);
  return match ? match[1] : null;
}

function pushRef(map: Map<string, FileReference[]>, filename: string | null, ref: FileReference) {
  if (!filename) return;
  const list = map.get(filename) ?? [];
  list.push(ref);
  map.set(filename, list);
}

/** Every local /uploads/* reference, with enough detail to rewrite each occurrence in place. */
async function collectFileReferences(): Promise<Map<string, FileReference[]>> {
  const map = new Map<string, FileReference[]>();

  const associations = await prisma.association.findMany({ select: { id: true, name: true, logo: true, homepageContent: true } });
  for (const a of associations) {
    pushRef(map, filenameOf(a.logo), {
      associationIds: [a.id],
      describe: `${a.name} — logo`,
      rewrite: async (newFilename) => {
        await prisma.association.update({ where: { id: a.id }, data: { logo: `/uploads/${newFilename}` } });
      },
    });

    const hc = a.homepageContent as HomepageContent | null;
    if (hc?.aboutImage) {
      pushRef(map, filenameOf(hc.aboutImage), {
        associationIds: [a.id],
        describe: `${a.name} — About section image`,
        rewrite: async (newFilename) => {
          const fresh = (await prisma.association.findUnique({ where: { id: a.id }, select: { homepageContent: true } }))
            ?.homepageContent as HomepageContent | null;
          if (!fresh) return;
          await prisma.association.update({
            where: { id: a.id },
            data: { homepageContent: { ...fresh, aboutImage: `/uploads/${newFilename}` } as unknown as Prisma.InputJsonValue },
          });
        },
      });
    }
    (hc?.heroSlides ?? []).forEach((slide, i) => {
      pushRef(map, filenameOf(slide.image), {
        associationIds: [a.id],
        describe: `${a.name} — Hero slide ${i + 1}`,
        rewrite: async (newFilename) => {
          const fresh = (await prisma.association.findUnique({ where: { id: a.id }, select: { homepageContent: true } }))
            ?.homepageContent as HomepageContent | null;
          if (!fresh?.heroSlides?.[i]) return;
          const heroSlides = fresh.heroSlides.map((s, idx) => (idx === i ? { ...s, image: `/uploads/${newFilename}` } : s));
          await prisma.association.update({
            where: { id: a.id },
            data: { homepageContent: { ...fresh, heroSlides } as unknown as Prisma.InputJsonValue },
          });
        },
      });
    });
  }

  const members = await prisma.member.findMany({
    select: { id: true, name: true, image: true, associations: { select: { associationId: true } } },
  });
  for (const m of members) {
    pushRef(map, filenameOf(m.image), {
      associationIds: m.associations.map((ma) => ma.associationId),
      describe: `Member: ${m.name} — photo`,
      rewrite: async (newFilename) => {
        await prisma.member.update({ where: { id: m.id }, data: { image: `/uploads/${newFilename}` } });
      },
    });
  }

  const events = await prisma.event.findMany({
    select: { id: true, title: true, associationId: true, image: true, promoImages: true, recapImages: true },
  });
  for (const e of events) {
    const associationIds = e.associationId ? [e.associationId] : [];
    pushRef(map, filenameOf(e.image), {
      associationIds,
      describe: `Event: ${e.title} — cover image`,
      rewrite: async (newFilename) => {
        await prisma.event.update({ where: { id: e.id }, data: { image: `/uploads/${newFilename}` } });
      },
    });
    e.promoImages.forEach((img, i) => {
      pushRef(map, filenameOf(img), {
        associationIds,
        describe: `Event: ${e.title} — promo image ${i + 1}`,
        rewrite: async (newFilename) => {
          const fresh = await prisma.event.findUnique({ where: { id: e.id }, select: { promoImages: true } });
          if (!fresh) return;
          const promoImages = fresh.promoImages.map((v, idx) => (idx === i ? `/uploads/${newFilename}` : v));
          await prisma.event.update({ where: { id: e.id }, data: { promoImages } });
        },
      });
    });
    e.recapImages.forEach((img, i) => {
      pushRef(map, filenameOf(img), {
        associationIds,
        describe: `Event: ${e.title} — recap image ${i + 1}`,
        rewrite: async (newFilename) => {
          const fresh = await prisma.event.findUnique({ where: { id: e.id }, select: { recapImages: true } });
          if (!fresh) return;
          const recapImages = fresh.recapImages.map((v, idx) => (idx === i ? `/uploads/${newFilename}` : v));
          await prisma.event.update({ where: { id: e.id }, data: { recapImages } });
        },
      });
    });
  }

  const news = await prisma.news.findMany({ select: { id: true, title: true, associationId: true, image: true } });
  for (const n of news) {
    pushRef(map, filenameOf(n.image), {
      associationIds: n.associationId ? [n.associationId] : [],
      describe: `News: ${n.title} — image`,
      rewrite: async (newFilename) => {
        await prisma.news.update({ where: { id: n.id }, data: { image: `/uploads/${newFilename}` } });
      },
    });
  }

  const committee = await prisma.committeeMember.findMany({ select: { id: true, name: true, associationId: true, image: true } });
  for (const c of committee) {
    pushRef(map, filenameOf(c.image), {
      associationIds: c.associationId ? [c.associationId] : [],
      describe: `Committee: ${c.name} — photo`,
      rewrite: async (newFilename) => {
        await prisma.committeeMember.update({ where: { id: c.id }, data: { image: `/uploads/${newFilename}` } });
      },
    });
  }

  const settings = await prisma.siteSettings.findMany({ select: { id: true, key: true, value: true, associationId: true } });
  for (const s of settings) {
    const filename = filenameOf(s.value);
    if (!filename) continue;
    pushRef(map, filename, {
      associationIds: s.associationId ? [s.associationId] : [],
      describe: `Setting: ${s.key}`,
      rewrite: async (newFilename) => {
        const oldPath = `/uploads/${filename}`;
        const fresh = await prisma.siteSettings.findUnique({ where: { id: s.id }, select: { value: true } });
        if (!fresh) return;
        await prisma.siteSettings.update({
          where: { id: s.id },
          data: { value: fresh.value.replace(oldPath, `/uploads/${newFilename}`) },
        });
      },
    });
  }

  return map;
}

export interface MissingUploadResult {
  filename: string;
  references: string[]; // describe strings for every DB record pointing at this missing file
}

/**
 * Finds every /uploads/* reference in the database whose file is NOT present on disk —
 * the inverse of the orphan check above (which finds files with no reference). Used for
 * incident triage after something has deleted real files out from under the DB (e.g. an
 * unsafe rsync), not for routine cleanup.
 */
export async function findMissingUploads(): Promise<MissingUploadResult[]> {
  const referencesByFile = await collectFileReferences();

  let onDisk: Set<string>;
  try {
    onDisk = new Set(await readdir(UPLOADS_DIR));
  } catch {
    onDisk = new Set();
  }

  const missing: MissingUploadResult[] = [];
  for (const [filename, refs] of referencesByFile) {
    if (onDisk.has(filename)) continue;
    missing.push({ filename, references: refs.map((r) => r.describe) });
  }
  return missing;
}

function sha256(filepath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filepath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

export interface DuplicateGroupResult {
  hash: string;
  files: string[]; // all filenames sharing this content
  canonical: string; // filename kept
  merged: string[]; // filenames repointed-and-deleted (or that would be, in dry-run)
  referencesRewritten: number;
  associationNames: string[];
}

export interface UploadsDedupResult {
  merged: DuplicateGroupResult[];
  skippedCrossTenant: { hash: string; files: string[]; associationNames: string[] }[];
  skippedTooRecent: number;
  freedBytes: number;
}

/**
 * Finds byte-identical files under /uploads and merges each group down to one file,
 * rewriting every DB record that pointed at a non-canonical copy first. A group is only
 * merged automatically when every reference to every file in it resolves to the SAME
 * association (or no association at all) — if two different associations each reference
 * a byte-identical file, merging would silently couple their records together, so that
 * group is left alone and reported separately instead.
 */
export async function mergeDuplicateUploads(opts: { dryRun?: boolean } = {}): Promise<UploadsDedupResult> {
  let filenames: string[];
  try {
    filenames = await readdir(UPLOADS_DIR);
  } catch {
    return { merged: [], skippedCrossTenant: [], skippedTooRecent: 0, freedBytes: 0 };
  }

  const cutoff = Date.now() - MIN_AGE_HOURS * 60 * 60 * 1000;
  const byHash = new Map<string, { filename: string; size: number; mtimeMs: number }[]>();
  let skippedTooRecent = 0;

  for (const filename of filenames) {
    const filepath = path.join(UPLOADS_DIR, filename);
    let fileStat;
    try {
      fileStat = await stat(filepath);
    } catch {
      continue;
    }
    if (!fileStat.isFile()) continue;
    if (fileStat.mtimeMs > cutoff) {
      skippedTooRecent++;
      continue;
    }

    const hash = await sha256(filepath);
    const list = byHash.get(hash) ?? [];
    list.push({ filename, size: fileStat.size, mtimeMs: fileStat.mtimeMs });
    byHash.set(hash, list);
  }

  const referencesByFile = await collectFileReferences();
  const associations = await prisma.association.findMany({ select: { id: true, name: true } });
  const associationName = new Map(associations.map((a) => [a.id, a.name]));

  const merged: DuplicateGroupResult[] = [];
  const skippedCrossTenant: UploadsDedupResult["skippedCrossTenant"] = [];
  let freedBytes = 0;

  for (const [hash, files] of byHash) {
    if (files.length < 2) continue;

    const associationIds = new Set<string>();
    for (const f of files) {
      for (const ref of referencesByFile.get(f.filename) ?? []) {
        for (const id of ref.associationIds) associationIds.add(id);
      }
    }
    const names = [...associationIds].map((id) => associationName.get(id) ?? id);

    if (associationIds.size > 1) {
      skippedCrossTenant.push({ hash, files: files.map((f) => f.filename), associationNames: names });
      continue;
    }

    // Canonical = the file with the most references (keeps the most already-correct data
    // untouched); ties broken by earliest upload (oldest mtime = the original).
    const refCount = (filename: string) => referencesByFile.get(filename)?.length ?? 0;
    const sorted = [...files].sort((a, b) => refCount(b.filename) - refCount(a.filename) || a.mtimeMs - b.mtimeMs);
    const canonical = sorted[0].filename;
    const duplicates = sorted.slice(1);

    let referencesRewritten = 0;
    for (const dup of duplicates) {
      const refs = referencesByFile.get(dup.filename) ?? [];
      if (!opts.dryRun) {
        for (const ref of refs) {
          await ref.rewrite(canonical);
          referencesRewritten++;
        }
      } else {
        referencesRewritten += refs.length;
      }
    }

    if (!opts.dryRun) {
      for (const dup of duplicates) {
        try {
          await unlink(path.join(UPLOADS_DIR, dup.filename));
        } catch {
          continue;
        }
      }
    }

    for (const dup of duplicates) freedBytes += dup.size;
    merged.push({
      hash,
      files: files.map((f) => f.filename),
      canonical,
      merged: duplicates.map((d) => d.filename),
      referencesRewritten,
      associationNames: names,
    });
  }

  return { merged, skippedCrossTenant, skippedTooRecent, freedBytes };
}
