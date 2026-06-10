import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meeting = await prisma.meeting.findFirst({ where: { id: params.id, associationId: ctx.associationId } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    memberId: string; amount: number;
    method?: string; status?: string; notes?: string;
  };

  if (!body.memberId || !body.amount) {
    return NextResponse.json({ success: false, error: "Member and amount required" }, { status: 400 });
  }

  const contribution = await prisma.memberContribution.create({
    data: {
      associationId: ctx.associationId,
      memberId:      body.memberId,
      meetingId:     params.id,
      amount:        body.amount,
      method:        body.method  ?? "pending",
      status:        body.status  ?? "pending",
      notes:         body.notes?.trim() || null,
      paidAt:        body.status === "paid" ? new Date() : null,
      recordedByAdminId: (ctx.session.user as { id?: string }).id ?? null,
    },
    include: { member: { select: { id: true, name: true, area: true } } },
  });

  return NextResponse.json({ success: true, data: contribution });
}
