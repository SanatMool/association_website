import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function PUT(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { title?: string; description?: string; outcome?: string; resolved?: boolean };
  const item = await prisma.agendaItem.update({
    where: { id: params.itemId },
    data: {
      ...(body.title       !== undefined ? { title: body.title }                    : {}),
      ...(body.description !== undefined ? { description: body.description || null }: {}),
      ...(body.outcome     !== undefined ? { outcome: body.outcome || null }         : {}),
      ...(body.resolved    !== undefined ? { resolved: body.resolved }               : {}),
    },
  });

  return NextResponse.json({ success: true, data: item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.agendaItem.delete({ where: { id: params.itemId } });
  return NextResponse.json({ success: true });
}
