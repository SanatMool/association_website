import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.duesPayment.findFirst({ where: { id: params.id, associationId: ctx.associationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as { status?: string; method?: string; receiptNumber?: string; notes?: string; paidAt?: string };

  const payment = await prisma.duesPayment.update({
    where: { id: params.id },
    data: {
      ...(body.status        ? { status: body.status } : {}),
      ...(body.method        ? { method: body.method } : {}),
      ...(body.receiptNumber !== undefined ? { receiptNumber: body.receiptNumber || null } : {}),
      ...(body.notes         !== undefined ? { notes: body.notes || null } : {}),
      paidAt: body.status === "paid" ? (body.paidAt ? new Date(body.paidAt) : new Date()) : existing.paidAt,
    },
    include: {
      member:         { select: { id: true, name: true } },
      memberCategory: { select: { id: true, name: true } },
    },
  });

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
