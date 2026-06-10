import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/portalAuth";

export async function GET() {
  const user = await getPortalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payments = await prisma.duesPayment.findMany({
    where: { memberId: user.memberId, associationId: user.associationId },
    orderBy: [{ periodStart: "desc" }],
    include: { memberCategory: { select: { name: true } } },
  });

  return NextResponse.json({ success: true, data: payments });
}
