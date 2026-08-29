import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meeting = await prisma.meeting.findFirst({ where: { id: params.id, associationId: ctx.associationId } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    content?: string;
    contentNe?: string;
    publish?: boolean;    // true = publish now
    unpublish?: boolean;  // true = retract
  };

  const minutes = await prisma.meetingMinutes.upsert({
    where:  { meetingId: params.id },
    create: {
      meetingId:  params.id,
      content:    body.content ?? "",
      contentNe:  body.contentNe?.trim() || null,
      publishedAt: body.publish ? new Date() : null,
    },
    update: {
      ...(body.content   !== undefined ? { content: body.content }                         : {}),
      ...(body.contentNe !== undefined ? { contentNe: body.contentNe?.trim() || null }     : {}),
      ...(body.publish    ? { publishedAt: new Date() }  : {}),
      ...(body.unpublish  ? { publishedAt: null }        : {}),
    },
  });

  return NextResponse.json({ success: true, data: minutes });
}
