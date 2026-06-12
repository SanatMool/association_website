import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { logActivity } from "@/lib/activityLogger";

export async function GET() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const committee = await prisma.committeeMember.findMany({
    where: { associationId, active: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(committee);
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const member = await prisma.committeeMember.create({
    data: { ...data, associationId: ctx.associationId },
  });
  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "committee.create",
    entityType: "committee",
    entityId:   member.id,
    entityName: member.name,
  });
  return NextResponse.json(member, { status: 201 });
}
