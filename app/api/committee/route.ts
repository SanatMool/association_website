import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const committee = await prisma.committeeMember.findMany({
    where: { associationId },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(committee);
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const member = await prisma.committeeMember.create({
    data: { ...data, associationId: ctx.associationId },
  });
  return NextResponse.json(member, { status: 201 });
}
