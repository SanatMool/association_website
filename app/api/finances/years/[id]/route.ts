import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { logActivity } from "@/lib/activityLogger";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const year = await prisma.financialYear.findFirst({ where: { id: params.id, associationId: ctx.associationId } });
  if (!year) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    label?: string;
    startDateAD?: string;
    endDateAD?: string;
    openingBalance?: number;
    status?: string; // "active" | "closed"
  };

  const closing = body.status === "closed" && year.status !== "closed";

  const updated = await prisma.financialYear.update({
    where: { id: params.id },
    data: {
      ...(body.label          ? { label:          body.label.trim() }             : {}),
      ...(body.startDateAD    ? { startDateAD:    new Date(body.startDateAD) }    : {}),
      ...(body.endDateAD      ? { endDateAD:      new Date(body.endDateAD) }      : {}),
      ...(body.openingBalance !== undefined ? { openingBalance: body.openingBalance } : {}),
      ...(body.status         ? { status:         body.status }                   : {}),
      ...(closing             ? { closedAt:       new Date() }                    : {}),
    },
  });

  if (closing) {
    logActivity({
      associationId: ctx.associationId,
      adminId:    (ctx.session.user as { id?: string }).id ?? null,
      adminName:  ctx.session.user?.name ?? null,
      action:     "financial_year.close",
      entityType: "financial_year",
      entityId:   params.id,
      entityName: updated.label,
    });
  }

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const year = await prisma.financialYear.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
    include: { _count: { select: { journalEntries: true } } },
  });
  if (!year) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (year._count.journalEntries > 0) {
    return NextResponse.json({ success: false, error: "Cannot delete a year that has journal entries. Close it instead." }, { status: 400 });
  }

  await prisma.financialYear.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
