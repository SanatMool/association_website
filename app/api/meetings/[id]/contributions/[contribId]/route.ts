import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

type PaymentLine = { method: string; amount: number };

export async function PATCH(req: NextRequest, { params }: { params: { id: string; contribId: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    status?: string; method?: string; notes?: string;
    paymentBreakdown?: PaymentLine[];
  };

  // Recompute total and primary method from breakdown if provided
  const breakdown = (body.paymentBreakdown ?? []).filter((l) => l.amount > 0);
  const totalAmount = breakdown.length > 0 ? breakdown.reduce((s, l) => s + l.amount, 0) : undefined;
  const primaryMethod = breakdown.length > 1
    ? "mixed"
    : breakdown.length === 1
      ? breakdown[0].method
      : body.method;

  const contribution = await prisma.memberContribution.update({
    where: { id: params.contribId },
    data: {
      ...(body.status   ? { status: body.status }              : {}),
      ...(primaryMethod ? { method: primaryMethod }            : {}),
      ...(totalAmount   ? { amount: totalAmount }              : {}),
      ...(breakdown.length > 0 ? { paymentBreakdown: breakdown } : {}),
      ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
      paidAt: body.status === "paid" ? new Date() : undefined,
    },
    include: { member: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ success: true, data: contribution });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; contribId: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.memberContribution.deleteMany({ where: { id: params.contribId, meetingId: params.id, associationId: ctx.associationId } });
  return NextResponse.json({ success: true });
}
