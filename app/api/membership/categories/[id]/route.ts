import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

async function getOwned(id: string, associationId: string) {
  return prisma.membershipCategory.findFirst({ where: { id, associationId } });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cat = await getOwned(params.id, ctx.associationId);
  if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const members = await prisma.memberAssociation.findMany({
    where: { memberCategoryId: params.id, associationId: ctx.associationId },
    select: { member: { select: { id: true, name: true, area: true, category: true } } },
    orderBy: { member: { name: "asc" } },
  });

  return NextResponse.json({ success: true, data: members.map((m) => m.member) });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!await getOwned(params.id, ctx.associationId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as { name: string; monthlyFee: number; annualRenewalFee: number };
  const category = await prisma.membershipCategory.update({
    where: { id: params.id },
    data: { name: body.name.trim(), monthlyFee: body.monthlyFee, annualRenewalFee: body.annualRenewalFee },
  });

  return NextResponse.json({ success: true, data: category });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!await getOwned(params.id, ctx.associationId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const memberCount = await prisma.memberAssociation.count({
    where: { memberCategoryId: params.id, associationId: ctx.associationId },
  });
  if (memberCount > 0) {
    return NextResponse.json(
      { success: false, error: `Cannot delete — ${memberCount} member${memberCount !== 1 ? "s" : ""} are enrolled in this category. Reassign them first.` },
      { status: 400 },
    );
  }

  await prisma.membershipCategory.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
