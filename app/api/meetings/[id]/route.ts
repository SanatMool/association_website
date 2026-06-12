import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { logActivity } from "@/lib/activityLogger";

async function getOwned(id: string, associationId: string) {
  return prisma.meeting.findFirst({ where: { id, associationId } });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meeting = await prisma.meeting.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
    include: {
      agendaItems: { orderBy: { order: "asc" } },
      minutes:     true,
      expenses:    { include: { vendor: true }, orderBy: { createdAt: "asc" } },
      contributions: {
        include: { member: { select: { id: true, name: true, area: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { rsvps: true } },
    },
  });

  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: meeting });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await getOwned(params.id, ctx.associationId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    title?: string; type?: string; scheduledAt?: string;
    venue?: string; description?: string; status?: string;
    latitude?: number | null; longitude?: number | null;
    titleNe?: string; descriptionNe?: string;
  };

  const meeting = await prisma.meeting.update({
    where: { id: params.id },
    data: {
      ...(body.title       ? { title: body.title.trim() }                : {}),
      ...(body.type        ? { type: body.type }                         : {}),
      ...(body.scheduledAt ? { scheduledAt: new Date(body.scheduledAt) } : {}),
      ...(body.status      ? { status: body.status }                     : {}),
      venue:       body.venue?.trim()       ?? undefined,
      description: body.description?.trim() ?? undefined,
      ...(body.latitude  !== undefined ? { latitude:  body.latitude  } : {}),
      ...(body.longitude !== undefined ? { longitude: body.longitude } : {}),
      ...(body.titleNe       !== undefined ? { titleNe:       body.titleNe?.trim()       || null } : {}),
      ...(body.descriptionNe !== undefined ? { descriptionNe: body.descriptionNe?.trim() || null } : {}),
    },
  });

  return NextResponse.json({ success: true, data: meeting });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = await getOwned(params.id, ctx.associationId);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.meeting.delete({ where: { id: params.id } });
  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "meeting.delete",
    entityType: "meeting",
    entityId:   params.id,
    entityName: owned.title,
  });
  return NextResponse.json({ success: true });
}
