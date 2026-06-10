import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; expenseId: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.expense.deleteMany({ where: { id: params.expenseId, meetingId: params.id, associationId: ctx.associationId } });
  return NextResponse.json({ success: true });
}
