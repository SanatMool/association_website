import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; contribId: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { status?: string; method?: string; notes?: string };
  const contribution = await prisma.memberContribution.update({
    where: { id: params.contribId },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.method ? { method: body.method } : {}),
      ...(body.notes  !== undefined ? { notes: body.notes || null } : {}),
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
