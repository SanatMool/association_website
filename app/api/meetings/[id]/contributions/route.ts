import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

type PaymentLine = { method: string; amount: number };

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meeting = await prisma.meeting.findFirst({ where: { id: params.id, associationId: ctx.associationId } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    memberId: string; amount?: number;
    method?: string; status?: string; notes?: string;
    paymentBreakdown?: PaymentLine[];
  };

  if (!body.memberId) {
    return NextResponse.json({ success: false, error: "Member is required" }, { status: 400 });
  }

  // Derive total and primary method from breakdown if provided
  const breakdown = (body.paymentBreakdown ?? []).filter((l) => l.amount > 0);
  const totalAmount = breakdown.length > 0
    ? breakdown.reduce((s, l) => s + l.amount, 0)
    : (body.amount ?? 0);
  const primaryMethod = breakdown.length > 1
    ? "mixed"
    : breakdown.length === 1
      ? breakdown[0].method
      : (body.method ?? "pending");

  if (!totalAmount || totalAmount <= 0) {
    return NextResponse.json({ success: false, error: "Amount must be greater than 0" }, { status: 400 });
  }

  const contribution = await prisma.memberContribution.create({
    data: {
      associationId:    ctx.associationId,
      memberId:         body.memberId,
      meetingId:        params.id,
      amount:           totalAmount,
      method:           primaryMethod,
      status:           body.status ?? "pending",
      paymentBreakdown: breakdown.length > 0 ? breakdown : undefined,
      notes:            body.notes?.trim() || null,
      paidAt:           body.status === "paid" ? new Date() : null,
      recordedByAdminId: (ctx.session.user as { id?: string }).id ?? null,
    },
    include: { member: { select: { id: true, name: true, area: true } } },
  });

  return NextResponse.json({ success: true, data: contribution });
}
