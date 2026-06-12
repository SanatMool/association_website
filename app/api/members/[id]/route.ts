import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { logApiCall } from "@/lib/apiLogger";
import { logActivity } from "@/lib/activityLogger";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const member = await prisma.member.findUnique({ where: { id: params.id } });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(member);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const start = Date.now();
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the member belongs to this association
  const link = await prisma.memberAssociation.findUnique({
    where: { memberId_associationId: { memberId: params.id, associationId: ctx.associationId ?? "" } },
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await req.json();
  const member = await prisma.member.update({ where: { id: params.id }, data });
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
    action:     "member.update",
    entityType: "member",
    entityId:   member.id,
    entityName: member.name,
  });
  return NextResponse.json(member);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const start = Date.now();
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the member belongs to this association
  const link = await prisma.memberAssociation.findUnique({
    where: { memberId_associationId: { memberId: params.id, associationId: ctx.associationId ?? "" } },
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const deletedMember = await prisma.member.findUnique({ where: { id: params.id }, select: { name: true } });
  await prisma.member.delete({ where: { id: params.id } });
  logApiCall({
    associationId: ctx.associationId,
    path: new URL(req.url).pathname,
    method: "DELETE",
    statusCode: 200,
    responseTimeMs: Date.now() - start,
    adminUserId: (ctx.session.user as { id?: string }).id ?? null,
    ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
  });
  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "member.delete",
    entityType: "member",
    entityId:   params.id,
    entityName: deletedMember?.name ?? null,
  });
  return NextResponse.json({ success: true });
}
