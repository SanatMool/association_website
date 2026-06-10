import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meeting = await prisma.meeting.findFirst({ where: { id: params.id, associationId: ctx.associationId } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as { content: string; publish?: boolean };

  const minutes = await prisma.meetingMinutes.upsert({
    where:  { meetingId: params.id },
    create: { meetingId: params.id, content: body.content, publishedAt: body.publish ? new Date() : null },
    update: { content: body.content, ...(body.publish ? { publishedAt: new Date() } : {}) },
  });

  return NextResponse.json({ success: true, data: minutes });
}
