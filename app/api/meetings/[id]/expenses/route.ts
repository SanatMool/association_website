import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { journalForExpense } from "@/lib/autoJournal";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meeting = await prisma.meeting.findFirst({ where: { id: params.id, associationId: ctx.associationId } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    description: string; amount: number;
    vendorId?: string; vendorName?: string; saveVendor?: boolean;
  };

  if (!body.description?.trim() || !body.amount) {
    return NextResponse.json({ success: false, error: "Description and amount required" }, { status: 400 });
  }

  let vendorId = body.vendorId || null;

  // Save as new vendor if requested
  if (!vendorId && body.vendorName?.trim() && body.saveVendor) {
    const vendor = await prisma.expenseVendor.create({
      data: { associationId: ctx.associationId, name: body.vendorName.trim() },
    });
    vendorId = vendor.id;
  }

  const expense = await prisma.expense.create({
    data: {
      associationId: ctx.associationId,
      meetingId:     params.id,
      vendorId,
      vendorName:    vendorId ? null : (body.vendorName?.trim() || null),
      description:   body.description.trim(),
      amount:        body.amount,
    },
    include: { vendor: true },
  });

  journalForExpense({
    associationId: ctx.associationId,
    expenseId:     expense.id,
    description:   expense.description,
    amount:        Number(expense.amount),
    date:          expense.createdAt,
    adminId:       (ctx.session.user as { id?: string }).id ?? null,
  });

  return NextResponse.json({ success: true, data: expense });
}
