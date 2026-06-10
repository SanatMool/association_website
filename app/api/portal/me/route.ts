import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/portalAuth";

export async function GET() {
  const user = await getPortalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.member.findUnique({
    where: { id: user.memberId },
    select: { id: true, name: true, nameNe: true, area: true, image: true, email: true, phone: true },
  });

  const association = await prisma.association.findUnique({
    where: { id: user.associationId },
    select: { id: true, name: true, logo: true, foundedYear: true },
  });

  return NextResponse.json({ success: true, data: { user, member, association } });
}
