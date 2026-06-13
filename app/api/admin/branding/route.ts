import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const headersList = await headers();
  const hostname = headersList.get("x-hostname") ?? "";
  const association = await prisma.association.findUnique({ where: { domain: hostname } });
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
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
