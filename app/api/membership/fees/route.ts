import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fees = await prisma.associationFee.findMany({
    where: { associationId: ctx.associationId ?? undefined },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ success: true, data: fees.map((f) => ({ ...f, amount: String(f.amount) })) });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { name?: string; amount?: number; description?: string };
  if (!body.name?.trim()) return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
  if (body.amount === undefined || isNaN(body.amount) || body.amount < 0)
    return NextResponse.json({ success: false, error: "Valid amount is required" }, { status: 400 });

  const fee = await prisma.associationFee.create({
    data: {
      associationId: ctx.associationId,
      name:          body.name.trim(),
      amount:        body.amount,
      description:   body.description?.trim() || null,
    },
  });

  return NextResponse.json({ success: true, data: { ...fee, amount: String(fee.amount) } });
}
