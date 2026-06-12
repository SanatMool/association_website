import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { logActivity } from "@/lib/activityLogger";

export async function GET(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const status   = searchParams.get("status");
  const type     = searchParams.get("type");

  const payments = await prisma.duesPayment.findMany({
    where: {
      associationId: ctx.associationId,
      ...(memberId ? { memberId } : {}),
      ...(status   ? { status }   : {}),
      ...(type     ? { type }     : {}),
    },
    include: {
      member:         { select: { id: true, name: true, area: true } },
      memberCategory: { select: { id: true, name: true } },
    },
    orderBy: [{ periodStart: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ success: true, data: payments });
}

type PaymentLine = { method: string; amount: number };

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    memberId: string;
    memberCategoryId?: string;
    type: string;
    amount?: number;
    periodStart: string;
    periodEnd: string;
    method?: string;
    status: string;
    receiptNumber?: string;
    notes?: string;
    paidAt?: string;
    paymentBreakdown?: PaymentLine[];
  };

  if (!body.memberId || !body.type || !body.periodStart || !body.periodEnd) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
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

  // Verify member belongs to this association
  const link = await prisma.memberAssociation.findUnique({
    where: { memberId_associationId: { memberId: body.memberId, associationId: ctx.associationId } },
  });
  if (!link) return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });

  // If category provided, update the member's category on the link
  if (body.memberCategoryId && body.memberCategoryId !== link.memberCategoryId) {
    await prisma.memberAssociation.update({
      where: { memberId_associationId: { memberId: body.memberId, associationId: ctx.associationId } },
      data: { memberCategoryId: body.memberCategoryId },
    });
  }

  const payment = await prisma.duesPayment.create({
    data: {
      associationId:    ctx.associationId,
      memberId:         body.memberId,
      memberCategoryId: body.memberCategoryId || link.memberCategoryId || null,
      type:             body.type,
      amount:           totalAmount,
      periodStart:      new Date(body.periodStart),
      periodEnd:        new Date(body.periodEnd),
      method:           primaryMethod,
      status:           body.status,
      receiptNumber:    body.receiptNumber || null,
      notes:            body.notes || null,
      paymentBreakdown: breakdown.length > 0 ? breakdown : undefined,
      paidAt:           body.status === "paid" ? (body.paidAt ? new Date(body.paidAt) : new Date()) : null,
      recordedByAdminId: (ctx.session.user as { id?: string }).id ?? null,
    },
    include: {
      member:         { select: { id: true, name: true, area: true } },
      memberCategory: { select: { id: true, name: true } },
    },
  });

  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     body.status === "paid" ? "dues.record_paid" : "dues.record_pending",
    entityType: "dues",
    entityId:   payment.id,
    entityName: payment.member.name,
    meta:       { amount: Number(payment.amount), type: payment.type, status: payment.status },
  });
  return NextResponse.json({ success: true, data: payment });
}
