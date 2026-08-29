import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET(_req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.financialAccount.findMany({
    where: { associationId: ctx.associationId },
    orderBy: [{ order: "asc" }, { code: "asc" }],
    include: {
      _count: { select: { debitEntries: true, creditEntries: true } },
    },
  });

  return NextResponse.json({ success: true, data: accounts });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { code: string; name: string; type: string; order?: number };
  if (!body.code?.trim() || !body.name?.trim() || !body.type) {
    return NextResponse.json({ success: false, error: "code, name, type are required" }, { status: 400 });
  }

  const valid = ["asset", "income", "expense", "liability"];
  if (!valid.includes(body.type)) {
    return NextResponse.json({ success: false, error: "type must be: asset, income, expense, or liability" }, { status: 400 });
  }

  const existing = await prisma.financialAccount.findUnique({
    where: { associationId_code: { associationId: ctx.associationId, code: body.code.trim() } },
  });
  if (existing) return NextResponse.json({ success: false, error: "Account code already exists" }, { status: 409 });

  const account = await prisma.financialAccount.create({
    data: {
      associationId: ctx.associationId,
      code:  body.code.trim(),
      name:  body.name.trim(),
      type:  body.type,
      order: body.order ?? 99,
    },
  });

  return NextResponse.json({ success: true, data: account });
}
