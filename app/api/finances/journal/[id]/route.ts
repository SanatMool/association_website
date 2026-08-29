import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { logActivity } from "@/lib/activityLogger";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.journalEntry.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    date?: string;
    description?: string;
    debitAccountId?: string;
    creditAccountId?: string;
    amount?: number;
    reference?: string | null;
  };

  if (body.amount !== undefined && body.amount <= 0) {
    return NextResponse.json({ success: false, error: "Amount must be greater than 0" }, { status: 400 });
  }

  const updated = await prisma.journalEntry.update({
    where: { id: params.id },
    data: {
      ...(body.date            ? { date:            new Date(body.date) }    : {}),
      ...(body.description     ? { description:     body.description.trim() } : {}),
      ...(body.debitAccountId  ? { debitAccountId:  body.debitAccountId }    : {}),
      ...(body.creditAccountId ? { creditAccountId: body.creditAccountId }   : {}),
      ...(body.amount          ? { amount:          body.amount }             : {}),
      ...(body.reference !== undefined ? { reference: body.reference?.trim() || null } : {}),
    },
    include: {
      debitAccount:  { select: { id: true, code: true, name: true, type: true } },
      creditAccount: { select: { id: true, code: true, name: true, type: true } },
    },
  });

  // Audit log — store old values for fraud detection
  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "journal.edit",
    entityType: "journal_entry",
    entityId:   params.id,
    entityName: updated.description,
    meta: {
      before: {
        amount:      Number(existing.amount),
        description: existing.description,
        date:        existing.date.toISOString(),
      },
      after: {
        amount:      Number(updated.amount),
        description: updated.description,
        date:        updated.date.toISOString(),
      },
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.journalEntry.findFirst({ where: { id: params.id, associationId: ctx.associationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.journalEntry.delete({ where: { id: params.id } });

  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "journal.delete",
    entityType: "journal_entry",
    entityId:   params.id,
    entityName: existing.description,
    meta:       { amount: Number(existing.amount), entityType: existing.entityType },
  });

  return NextResponse.json({ success: true });
}
