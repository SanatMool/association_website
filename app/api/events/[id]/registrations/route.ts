import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const regs = await prisma.ticketRegistration.findMany({
    where: {
      eventId:       params.id,
      associationId: ctx.associationId,
      ...(status ? { paymentStatus: status } : {}),
    },
    include: { ticketType: { select: { id: true, name: true, price: true, section: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ success: true, data: regs });
}
