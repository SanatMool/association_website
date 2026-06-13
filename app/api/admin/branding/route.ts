import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx?.associationId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const association = await prisma.association.findUnique({
    where: { id: ctx.associationId },
  });
  if (!association) {
    return NextResponse.json({ success: false, error: "Association not found" }, { status: 404 });
  }

  const memberCount = await prisma.memberAssociation.count({
    where: { associationId: association.id, visible: true },
  });

  const yearsActive = association.foundedYear
    ? new Date().getFullYear() - association.foundedYear
    : null;

  return NextResponse.json({
    success: true,
    data: {
      name:        association.name,
      logo:        association.logo ?? null,
      description: association.description ?? null,
      foundedYear: association.foundedYear ?? null,
      yearsActive,
      memberCount,
    },
  });
}
