import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/portalAuth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getPortalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status, guestCount, note } = await req.json() as { status: string; guestCount?: number; note?: string };

  const account = await prisma.memberAccount.findFirst({ where: { memberId: user.memberId, associationId: user.associationId } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const rsvp = await prisma.eventRsvp.upsert({
    where: { eventId_memberAccountId: { eventId: params.id, memberAccountId: account.id } },
    create: { eventId: params.id, memberAccountId: account.id, status, guestCount: guestCount ?? 1, note: note || null },
    update: { status, guestCount: guestCount ?? 1, note: note || null },
  });

  return NextResponse.json({ success: true, data: rsvp });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getPortalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.memberAccount.findFirst({ where: { memberId: user.memberId, associationId: user.associationId } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  await prisma.eventRsvp.deleteMany({ where: { eventId: params.id, memberAccountId: account.id } });
  return NextResponse.json({ success: true });
}
