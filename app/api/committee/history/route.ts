import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

// GET /api/committee/history
// Returns archived (active=false) committee members grouped by BS term year.
export async function GET() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const members = await prisma.committeeMember.findMany({
    where: { associationId, active: false },
    orderBy: [{ termYearBS: "desc" }, { termMonthBS: "desc" }, { order: "asc" }],
  });

  // Group by termYearBS (fallback to termYearAD if BS not set)
  const grouped: Record<string, typeof members> = {};
  for (const m of members) {
    const key = m.termYearBS
      ? `${m.termYearBS}_${m.termYearAD ?? ""}`
      : `_${m.termYearAD ?? "unknown"}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  }

  const terms = Object.entries(grouped).map(([key, items]) => {
    const first = items[0];
    return {
      key,
      termYearBS:  first.termYearBS,
      termMonthBS: first.termMonthBS,
      termYearAD:  first.termYearAD,
      termMonthAD: first.termMonthAD,
      members:     items,
    };
  });

  return NextResponse.json({ success: true, data: terms });
}
