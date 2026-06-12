import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { logActivity } from "@/lib/activityLogger";

// POST /api/committee/archive
// Archives all active=true committee members for this association,
// stamping them with the provided term year/month fields.
export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    termYearBS: number;
    termMonthBS: number;
    termYearAD: number;
    termMonthAD: number;
  };

  const { termYearBS, termMonthBS, termYearAD, termMonthAD } = body;

  if (!termYearBS || !termYearAD) {
    return NextResponse.json(
      { success: false, error: "termYearBS and termYearAD are required." },
      { status: 400 }
    );
  }

  const result = await prisma.committeeMember.updateMany({
    where: { associationId: ctx.associationId, active: true },
    data: {
      active:       false,
      termYearBS:   termYearBS,
      termMonthBS:  termMonthBS ?? null,
      termYearAD:   termYearAD,
      termMonthAD:  termMonthAD ?? null,
    },
  });

  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "committee.archive",
    entityType: "committee",
    meta:       { archived: result.count, termYearAD, termYearBS },
  });
  return NextResponse.json({ success: true, data: { archived: result.count } });
}
