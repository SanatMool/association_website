import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

async function ownerCheck(meetingId: string, associationId: string) {
  return prisma.meeting.findFirst({ where: { id: meetingId, associationId } });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!await ownerCheck(params.id, ctx.associationId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const attendance = await prisma.meetingAttendance.findMany({
    where: { meetingId: params.id },
    include: { member: { select: { id: true, name: true, area: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ success: true, data: attendance });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!await ownerCheck(params.id, ctx.associationId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json() as { memberId: string; note?: string };
  if (!body.memberId) return NextResponse.json({ success: false, error: "memberId required" }, { status: 400 });

  // Verify member belongs to this association
  const link = await prisma.memberAssociation.findUnique({
    where: { memberId_associationId: { memberId: body.memberId, associationId: ctx.associationId } },
  });
  if (!link) return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });

  const record = await prisma.meetingAttendance.upsert({
    where: { meetingId_memberId: { meetingId: params.id, memberId: body.memberId } },
    create: {
      meetingId:         params.id,
      memberId:          body.memberId,
      associationId:     ctx.associationId,
      note:              body.note?.trim() || null,
      recordedByAdminId: (ctx.session.user as { id?: string }).id ?? null,
    },
    update: {
      note: body.note?.trim() || null,
    },
    include: { member: { select: { id: true, name: true, area: true, image: true } } },
  });

  return NextResponse.json({ success: true, data: record });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ success: false, error: "memberId required" }, { status: 400 });

  await prisma.meetingAttendance.deleteMany({
    where: { meetingId: params.id, memberId },
  });

  return NextResponse.json({ success: true });
}
