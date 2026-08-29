import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/portalAuth";

export async function GET() {
  const user = await getPortalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [meetings, attendedIds] = await Promise.all([
    prisma.meeting.findMany({
      where: { associationId: user.associationId },
      orderBy: { scheduledAt: "desc" },
      include: {
        agendaItems: {
          orderBy: { order: "asc" },
          select: { title: true, description: true, resolved: true, outcome: true },
        },
        minutes: { select: { content: true, contentNe: true, publishedAt: true } },
        rsvps: {
          where: { memberAccount: { memberId: user.memberId, associationId: user.associationId } },
          select: { id: true, status: true, guestCount: true, note: true },
        },
        _count: { select: { rsvps: true } },
      },
    }),
    // Which meetings did this member physically attend (Phase C MeetingAttendance)
    prisma.meetingAttendance.findMany({
      where: { memberId: user.memberId },
      select: { meetingId: true },
    }),
  ]);

  const attendedSet = new Set(attendedIds.map((a) => a.meetingId));

  const data = meetings.map((m) => ({
    ...m,
    attended: attendedSet.has(m.id),
  }));

  return NextResponse.json({ success: true, data });
}
