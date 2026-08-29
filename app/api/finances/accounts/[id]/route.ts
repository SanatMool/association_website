import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.financialAccount.findFirst({ where: { id: params.id, associationId: ctx.associationId } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as { name?: string; order?: number };

  const updated = await prisma.financialAccount.update({
    where: { id: params.id },
    data: {
      ...(body.name  !== undefined ? { name:  body.name.trim() } : {}),
      ...(body.order !== undefined ? { order: body.order }       : {}),
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.financialAccount.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
    include: { _count: { select: { debitEntries: true, creditEntries: true } } },
  });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (account.isDefault) return NextResponse.json({ success: false, error: "Cannot delete a default account" }, { status: 400 });

  const entryCount = account._count.debitEntries + account._count.creditEntries;
  if (entryCount > 0) {
    return NextResponse.json({ success: false, error: "Cannot delete an account that has journal entries" }, { status: 400 });
  }

  await prisma.financialAccount.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
