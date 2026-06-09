import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const events = await prisma.event.findMany({
    where: { associationId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const event = await prisma.event.create({
    data: {
      ...data,
      associationId: ctx.associationId,
      date: new Date(data.date),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });
  return NextResponse.json(event, { status: 201 });
}
