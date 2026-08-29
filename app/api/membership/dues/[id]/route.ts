import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { journalForDues } from "@/lib/autoJournal";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.duesPayment.findFirst({ where: { id: params.id, associationId: ctx.associationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  type BreakdownLine = { method: string; amount: number };
  const body = await req.json() as {
    status?: string; method?: string; receiptNumber?: string; notes?: string; paidAt?: string;
    paymentBreakdown?: BreakdownLine[];
    dueAmount?: number | null;
  };

  // Derive method + amount paid from breakdown when provided
  const breakdown     = (body.paymentBreakdown ?? []).filter((l) => l.amount > 0);
  const derivedMethod = breakdown.length > 1 ? "mixed" : breakdown.length === 1 ? breakdown[0].method : body.method;
  const derivedPaid   = breakdown.length > 0 ? breakdown.reduce((s, l) => s + l.amount, 0) : undefined;

  // dueAmount: explicit value, null to clear, or keep existing
  const newDueAmount = body.dueAmount !== undefined ? (body.dueAmount ?? null) : undefined;

  // Auto-derive status from paid vs due amounts
  const effectiveDue  = newDueAmount !== undefined ? (newDueAmount ?? 0) : Number(existing.dueAmount ?? 0);
  const effectivePaid = derivedPaid ?? Number(existing.amount);
  const autoStatus    = effectiveDue > 0
    ? (effectivePaid >= effectiveDue ? "paid" : effectivePaid > 0 ? "partial" : "pending")
    : (body.status ?? existing.status);

  const payment = await prisma.duesPayment.update({
    where: { id: params.id },
    data: {
      status:        autoStatus,
      ...(derivedMethod                      ? { method: derivedMethod }        : {}),
      ...(derivedPaid !== undefined          ? { amount: derivedPaid }          : {}),
      ...(newDueAmount !== undefined         ? { dueAmount: newDueAmount }      : {}),
      ...(breakdown.length > 0              ? { paymentBreakdown: breakdown }   : {}),
      ...(body.receiptNumber !== undefined  ? { receiptNumber: body.receiptNumber || null } : {}),
      ...(body.notes         !== undefined  ? { notes: body.notes || null }     : {}),
      paidAt: (autoStatus === "paid" || autoStatus === "partial") ? (body.paidAt ? new Date(body.paidAt) : (existing.paidAt ?? new Date())) : existing.paidAt,
    },
    include: {
      member:         { select: { id: true, name: true } },
      memberCategory: { select: { id: true, name: true } },
    },
  });

  // Auto-journal when payment is collected
  if ((autoStatus === "paid" || autoStatus === "partial") && (derivedPaid ?? 0) > 0) {
    const prevStatus = existing.status;
    if (prevStatus !== "paid" && prevStatus !== "partial") {
      journalForDues({
        associationId: ctx.associationId,
        duesId:        params.id,
        description:   `Dues payment — ${payment.member.name}`,
        amount:        Number(payment.amount),
        method:        payment.method,
        receiptNumber: payment.receiptNumber,
        date:          payment.paidAt ?? new Date(),
        adminId:       (ctx.session.user as { id?: string }).id ?? null,
      });
    }
  }

  return NextResponse.json({ success: true, data: payment });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.duesPayment.findFirst({ where: { id: params.id, associationId: ctx.associationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.duesPayment.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
