import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const types = await prisma.ticketType.findMany({
    where: { eventId: params.id, associationId: ctx.associationId },
    orderBy: { order: "asc" },
    include: { _count: { select: { registrations: true } } },
  });
  return NextResponse.json({ success: true, data: types });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findFirst({ where: { id: params.id, associationId: ctx.associationId } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    name: string; description?: string; section?: string;
    price?: number; memberPrice?: number;
    totalCapacity?: number | null; strictCapacity?: boolean; order?: number;
  };
  if (!body.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const type = await prisma.ticketType.create({
    data: {
      eventId:       params.id,
      associationId: ctx.associationId,
      name:          body.name.trim(),
      description:   body.description?.trim() || null,
      section:       body.section?.trim() || null,
      price:         body.price ?? 0,
      memberPrice:   body.memberPrice ?? null,
      totalCapacity: body.totalCapacity ?? null,
      strictCapacity: body.strictCapacity ?? false,
      order:         body.order ?? 0,
    },
  });
  return NextResponse.json({ success: true, data: type }, { status: 201 });
}
