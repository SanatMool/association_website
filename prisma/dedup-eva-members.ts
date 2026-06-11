/**
 * dedup-eva-members.ts
 *
 * Finds and removes duplicate Member records in the EVA Nepal association.
 * Keeps the oldest record per unique name (earliest createdAt, which is the
 * slug without a numeric suffix).  Deletes the rest — MemberAssociation links
 * cascade-delete automatically.
 *
 * Run:   npx tsx prisma/dedup-eva-members.ts
 * Dry run (no deletes): set DRY_RUN=true below
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DRY_RUN = false; // Set true to only print what would be deleted

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const EVA_ASSOCIATION_ID = "cmq6aarky00003vs6umm7b8xn";

async function main() {
  console.log(`🔍 Scanning EVA Nepal members for duplicates (DRY_RUN=${DRY_RUN})...\n`);

  // All member records linked to EVA Nepal, ordered oldest first
  const all = await prisma.memberAssociation.findMany({
    where:   { associationId: EVA_ASSOCIATION_ID },
    include: { member: { select: { id: true, name: true, slug: true, createdAt: true } } },
    orderBy: { member: { createdAt: "asc" } },
  });

  // Group by lowercase name
  const byName: Record<string, typeof all> = {};
  for (const link of all) {
    const key = link.member.name.toLowerCase().trim();
    if (!byName[key]) byName[key] = [];
    byName[key].push(link);
  }

  const duplicateGroups = Object.entries(byName).filter(([, rows]) => rows.length > 1);

  if (duplicateGroups.length === 0) {
    console.log("✅ No duplicates found. Database is clean.");
    return;
  }

  console.log(`Found ${duplicateGroups.length} duplicate groups:\n`);

  const toDelete: string[] = []; // Member IDs to delete

  for (const [name, rows] of duplicateGroups) {
    // Keep the first (oldest) — delete the rest
    const [keep, ...dupes] = rows;
    const dupeIds = dupes.map((r) => r.member.id);
    toDelete.push(...dupeIds);

    console.log(`  "${name}" (${rows.length} copies)`);
    console.log(`    ✓ Keep : ${keep.member.slug} (${keep.member.id})`);
    for (const d of dupes) {
      console.log(`    ✗ Delete: ${d.member.slug} (${d.member.id})`);
    }
  }

  console.log(`\nTotal to delete: ${toDelete.length} Member records\n`);

  if (DRY_RUN) {
    console.log("DRY_RUN=true — no changes made.");
    return;
  }

  // Delete duplicates — MemberAssociation links cascade automatically
  const result = await prisma.member.deleteMany({
    where: { id: { in: toDelete } },
  });

  console.log(`✅ Deleted ${result.count} duplicate Member records.`);

  // Verify
  const remaining = await prisma.memberAssociation.count({
    where: { associationId: EVA_ASSOCIATION_ID },
  });
  console.log(`   EVA Nepal now has ${remaining} member links.\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
