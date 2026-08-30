import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { logApiCall } from "@/lib/apiLogger";
import { logActivity } from "@/lib/activityLogger";
import { sanitizeEventGalleryFields } from "@/lib/event-gallery";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const start = Date.now();
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.event.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { publishTime, ...data } = await req.json();
  void publishTime;
  const event = await prisma.event.update({
    where: { id: params.id },
    data: {
      ...data,
      ...sanitizeEventGalleryFields(data),
      date: new Date(data.date),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });
  logApiCall({
    associationId: ctx.associationId,
    path: new URL(req.url).pathname,
    method: "PUT",
    statusCode: 200,
    responseTimeMs: Date.now() - start,
    adminUserId: (ctx.session.user as { id?: string }).id ?? null,
    ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
  });
  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "event.update",
    entityType: "event",
    entityId:   event.id,
    entityName: event.title,
  });
  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const start = Date.now();
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.event.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.event.delete({ where: { id: params.id } });
  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "event.delete",
    entityType: "event",
    entityId:   params.id,
    entityName: existing.title,
  });
  logApiCall({
    associationId: ctx.associationId,
    path: new URL(req.url).pathname,
    method: "DELETE",
    statusCode: 200,
    responseTimeMs: Date.now() - start,
    adminUserId: (ctx.session.user as { id?: string }).id ?? null,
    ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
  });
  return NextResponse.json({ success: true });
}
