import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { logActivity } from "@/lib/activityLogger";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meetings = await prisma.meeting.findMany({
    where: { associationId: ctx.associationId },
    orderBy: { scheduledAt: "desc" },
    include: {
      _count: { select: { agendaItems: true, expenses: true, contributions: true, rsvps: true } },
    },
  });

  return NextResponse.json({ success: true, data: meetings });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(ctx, "meetings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as {
    title: string; type: string; scheduledAt: string;
    venue?: string; description?: string; status?: string;
    latitude?: number | null; longitude?: number | null;
  };

  if (!body.title?.trim() || !body.type || !body.scheduledAt) {
    return NextResponse.json({ success: false, error: "Title, type and date are required" }, { status: 400 });
  }

  const meeting = await prisma.meeting.create({
    data: {
      associationId: ctx.associationId,
      title:       body.title.trim(),
      type:        body.type,
      scheduledAt: new Date(body.scheduledAt),
      venue:       body.venue?.trim() || null,
      description: body.description?.trim() || null,
      status:      body.status ?? "scheduled",
      latitude:    body.latitude  ?? null,
      longitude:   body.longitude ?? null,
    },
  });

  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "meeting.create",
    entityType: "meeting",
    entityId:   meeting.id,
    entityName: meeting.title,
  });
  return NextResponse.json({ success: true, data: meeting });
}
