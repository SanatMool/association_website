import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { logActivity } from "@/lib/activityLogger";
import { hasPermission } from "@/lib/permissions";
import { autoArchivePastEvents } from "@/lib/eventStatus";
import { sanitizeEventGalleryFields } from "@/lib/event-gallery";

export async function GET(req: NextRequest) {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;
  await autoArchivePastEvents(associationId);

  const events = await prisma.event.findMany({
    where: { associationId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(ctx, "events.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { publishTime, ...data } = await req.json();
  void publishTime;
  const event = await prisma.event.create({
    data: {
      ...data,
      ...sanitizeEventGalleryFields(data),
      associationId: ctx.associationId,
      date: new Date(data.date),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });
  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "event.create",
    entityType: "event",
    entityId:   event.id,
    entityName: event.title,
  });
  return NextResponse.json(event, { status: 201 });
}
