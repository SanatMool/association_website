import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const aId = ctx.associationId;

  // Verify meeting belongs to this association
  const meeting = await prisma.meeting.findFirst({ where: { id: params.id, associationId: aId } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get all RSVPs with "attending" status and their linked member
  const rsvps = await prisma.meetingRsvp.findMany({
    where: { meetingId: params.id, status: "attending" },
    include: {
      memberAccount: { select: { memberId: true } },
    },
  });

  if (rsvps.length === 0) {
    return NextResponse.json({ success: true, created: 0, message: "No attending RSVPs found." });
  }

  const adminId = (ctx.session.user as { id?: string }).id ?? null;

  // Upsert attendance records (skip if already marked)
  let created = 0;
  for (const rsvp of rsvps) {
    const memberId = rsvp.memberAccount.memberId;
    const existing = await prisma.meetingAttendance.findUnique({
      where: { meetingId_memberId: { meetingId: params.id, memberId } },
    });
    if (!existing) {
      await prisma.meetingAttendance.create({
        data: {
          meetingId:         params.id,
          memberId,
          associationId:     aId,
          recordedByAdminId: adminId,
        },
      });
      created++;
    }
  }

  return NextResponse.json({ success: true, created, total: rsvps.length });
}
