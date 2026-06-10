import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/portalAuth";

export async function GET() {
  const user = await getPortalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meetings = await prisma.meeting.findMany({
    where: { associationId: user.associationId },
    orderBy: { scheduledAt: "desc" },
    include: {
      agendaItems: { orderBy: { order: "asc" } },
      minutes:     { select: { content: true, publishedAt: true } },
      rsvps: {
        where: { memberAccount: { memberId: user.memberId, associationId: user.associationId } },
        select: { id: true, status: true, guestCount: true, note: true },
      },
      _count: { select: { rsvps: true } },
    },
  });

  return NextResponse.json({ success: true, data: meetings });
}
