import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/portalAuth";

export async function GET() {
  const user = await getPortalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.event.findMany({
    where: { associationId: user.associationId },
    orderBy: { date: "asc" },
    select: {
      id: true, title: true, titleNe: true, date: true, endDate: true,
      location: true, type: true, status: true, description: true, image: true,
      rsvps: { where: { memberAccount: { memberId: user.memberId, associationId: user.associationId } }, select: { id: true, status: true, guestCount: true, note: true } },
      _count: { select: { rsvps: true } },
    },
  });

  return NextResponse.json({ success: true, data: events });
}
