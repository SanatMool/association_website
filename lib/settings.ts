import { prisma } from "@/lib/prisma";

export async function getSettings(associationId?: string | null): Promise<Record<string, string>> {
  const rows = await prisma.siteSettings.findMany({
    where: { associationId: associationId ?? null },
  });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
