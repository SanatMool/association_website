import { prisma } from "@/lib/prisma";

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.siteSettings.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
