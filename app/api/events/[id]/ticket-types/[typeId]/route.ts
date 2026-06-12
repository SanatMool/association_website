import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function PUT(req: NextRequest, { params }: { params: { id: string; typeId: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.ticketType.findFirst({
    where: { id: params.typeId, eventId: params.id, associationId: ctx.associationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as Record<string, unknown>;
  const type = await prisma.ticketType.update({
    where: { id: params.typeId },
    data: {
      ...(body.name        !== undefined && { name:          (body.name as string).trim() }),
      ...(body.description !== undefined && { description:   (body.description as string)?.trim() || null }),
      ...(body.section     !== undefined && { section:       (body.section as string)?.trim() || null }),
      ...(body.price       !== undefined && { price:         body.price as number }),
      ...(body.memberPrice !== undefined && { memberPrice:   body.memberPrice as number | null }),
      ...(body.totalCapacity !== undefined && { totalCapacity: body.totalCapacity as number | null }),
      ...(body.strictCapacity !== undefined && { strictCapacity: body.strictCapacity as boolean }),
      ...(body.order       !== undefined && { order:         body.order as number }),
      ...(body.active      !== undefined && { active:        body.active as boolean }),
    },
  });
  return NextResponse.json({ success: true, data: type });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; typeId: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.ticketType.findFirst({
    where: { id: params.typeId, eventId: params.id, associationId: ctx.associationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.soldCount > 0) {
    return NextResponse.json({ error: "Cannot delete a ticket type that has registrations. Deactivate it instead." }, { status: 400 });
  }

  await prisma.ticketType.delete({ where: { id: params.typeId } });
  return NextResponse.json({ success: true });
}
