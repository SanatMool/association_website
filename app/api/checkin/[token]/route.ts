import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reg = await prisma.ticketRegistration.findUnique({
    where: { checkInToken: params.token },
    include: {
      event:      { select: { title: true, associationId: true } },
      ticketType: { select: { name: true, section: true } },
    },
  });
  if (!reg) return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
  if (reg.event.associationId !== ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (reg.paymentStatus !== "paid") return NextResponse.json({ error: "Registration is not paid" }, { status: 400 });
  if (reg.checkedIn) return NextResponse.json({ error: "Already checked in", data: reg }, { status: 409 });

  const updated = await prisma.ticketRegistration.update({
    where: { checkInToken: params.token },
    data: {
      checkedIn:   true,
      checkedInAt: new Date(),
      checkedInBy: ctx.session.user?.name ?? "Admin",
    },
    include: {
      event:      { select: { title: true } },
      ticketType: { select: { name: true, section: true } },
    },
  });
  return NextResponse.json({ success: true, data: updated });
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reg = await prisma.ticketRegistration.findUnique({
    where: { checkInToken: params.token },
    include: {
      event:      { select: { title: true, date: true, location: true, associationId: true } },
      ticketType: { select: { name: true, section: true } },
    },
  });
  if (!reg) return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
  if (reg.event.associationId !== ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  return NextResponse.json({ success: true, data: reg });
}
