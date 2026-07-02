import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fee = await prisma.associationFee.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!fee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as { name?: string; amount?: number; description?: string };
  if (!body.name?.trim()) return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
  if (body.amount === undefined || isNaN(body.amount) || body.amount < 0)
    return NextResponse.json({ success: false, error: "Valid amount is required" }, { status: 400 });

  const updated = await prisma.associationFee.update({
    where: { id: params.id },
    data: {
      name:        body.name.trim(),
      amount:      body.amount,
      description: body.description?.trim() || null,
    },
  });

  return NextResponse.json({ success: true, data: { ...updated, amount: String(updated.amount) } });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fee = await prisma.associationFee.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!fee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.associationFee.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
