import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET(_req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const years = await prisma.financialYear.findMany({
    where: { associationId: ctx.associationId },
    orderBy: { startDateAD: "desc" },
    include: { _count: { select: { journalEntries: true } } },
  });

  return NextResponse.json({ success: true, data: years });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    label: string;
    startDateAD: string;
    endDateAD: string;
    openingBalance?: number;
  };

  if (!body.label?.trim() || !body.startDateAD || !body.endDateAD) {
    return NextResponse.json({ success: false, error: "label, startDateAD, endDateAD are required" }, { status: 400 });
  }

  const year = await prisma.financialYear.create({
    data: {
      associationId:  ctx.associationId,
      label:          body.label.trim(),
      startDateAD:    new Date(body.startDateAD),
      endDateAD:      new Date(body.endDateAD),
      openingBalance: body.openingBalance ?? 0,
      status:         "active",
    },
  });

  return NextResponse.json({ success: true, data: year });
}
