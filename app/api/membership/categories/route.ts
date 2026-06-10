import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.membershipCategory.findMany({
    where: { associationId: ctx.associationId ?? undefined },
    orderBy: { name: "asc" },
    include: { _count: { select: { memberLinks: true } } },
  });

  return NextResponse.json({ success: true, data: categories });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { name: string; monthlyFee: number; annualRenewalFee: number };
  if (!body.name?.trim()) return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });

  const category = await prisma.membershipCategory.create({
    data: {
      associationId: ctx.associationId,
      name: body.name.trim(),
      monthlyFee: body.monthlyFee ?? 0,
      annualRenewalFee: body.annualRenewalFee ?? 0,
    },
  });

  return NextResponse.json({ success: true, data: category });
}
