import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const member = await prisma.member.findUnique({ where: { id: params.id } });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(member);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the member belongs to this association
  const link = await prisma.memberAssociation.findUnique({
    where: { memberId_associationId: { memberId: params.id, associationId: ctx.associationId ?? "" } },
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await req.json();
  const member = await prisma.member.update({ where: { id: params.id }, data });
  return NextResponse.json(member);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the member belongs to this association
  const link = await prisma.memberAssociation.findUnique({
    where: { memberId_associationId: { memberId: params.id, associationId: ctx.associationId ?? "" } },
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.member.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
