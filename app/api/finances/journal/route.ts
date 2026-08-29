import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { logActivity } from "@/lib/activityLogger";

export async function GET(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const yearId     = searchParams.get("yearId");
  const entityType = searchParams.get("type");
  const take       = Math.min(Number(searchParams.get("take") ?? "200"), 500);

  const entries = await prisma.journalEntry.findMany({
    where: {
      associationId:   ctx.associationId,
      ...(yearId      ? { financialYearId: yearId }     : {}),
      ...(entityType  ? { entityType }                  : {}),
    },
    include: {
      debitAccount:  { select: { id: true, code: true, name: true, type: true } },
      creditAccount: { select: { id: true, code: true, name: true, type: true } },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    take,
  });

  return NextResponse.json({ success: true, data: entries });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    financialYearId: string;
    date: string;
    description: string;
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    reference?: string;
  };

  if (!body.financialYearId || !body.date || !body.description?.trim() || !body.debitAccountId || !body.creditAccountId || !body.amount) {
    return NextResponse.json({ success: false, error: "financialYearId, date, description, debitAccountId, creditAccountId, amount are required" }, { status: 400 });
  }
  if (body.amount <= 0) {
    return NextResponse.json({ success: false, error: "Amount must be greater than 0" }, { status: 400 });
  }
  if (body.debitAccountId === body.creditAccountId) {
    return NextResponse.json({ success: false, error: "Debit and credit accounts must be different" }, { status: 400 });
  }

  // Verify year belongs to this association
  const year = await prisma.financialYear.findFirst({ where: { id: body.financialYearId, associationId: ctx.associationId } });
  if (!year) return NextResponse.json({ success: false, error: "Financial year not found" }, { status: 404 });

  // Verify both accounts belong to this association
  const accounts = await prisma.financialAccount.findMany({
    where: { associationId: ctx.associationId, id: { in: [body.debitAccountId, body.creditAccountId] } },
  });
  if (accounts.length < 2) return NextResponse.json({ success: false, error: "One or both accounts not found" }, { status: 404 });

  const entry = await prisma.journalEntry.create({
    data: {
      associationId:    ctx.associationId,
      financialYearId:  body.financialYearId,
      date:             new Date(body.date),
      description:      body.description.trim(),
      debitAccountId:   body.debitAccountId,
      creditAccountId:  body.creditAccountId,
      amount:           body.amount,
      reference:        body.reference?.trim() || null,
      entityType:       "manual",
      createdByAdminId: (ctx.session.user as { id?: string }).id ?? null,
    },
    include: {
      debitAccount:  { select: { id: true, code: true, name: true, type: true } },
      creditAccount: { select: { id: true, code: true, name: true, type: true } },
    },
  });

  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "journal.create",
    entityType: "journal_entry",
    entityId:   entry.id,
    entityName: entry.description,
    meta:       { amount: Number(entry.amount) },
  });

  return NextResponse.json({ success: true, data: entry });
}
