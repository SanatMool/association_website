import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meeting = await prisma.meeting.findFirst({ where: { id: params.id, associationId: ctx.associationId } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as { title: string; description?: string; order?: number };
  if (!body.title?.trim()) return NextResponse.json({ success: false, error: "Title required" }, { status: 400 });

  const count = await prisma.agendaItem.count({ where: { meetingId: params.id } });
  const item  = await prisma.agendaItem.create({
    data: { meetingId: params.id, title: body.title.trim(), description: body.description?.trim() || null, order: body.order ?? count + 1 },
  });

  return NextResponse.json({ success: true, data: item });
}
