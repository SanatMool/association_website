import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password } = await req.json() as { password: string };
  if (!password) return NextResponse.json({ success: false, error: "Password required" }, { status: 400 });

  const account = await prisma.memberAccount.findFirst({ where: { id: params.id, associationId: ctx.associationId } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.memberAccount.update({ where: { id: params.id }, data: { passwordHash } });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.memberAccount.findFirst({ where: { id: params.id, associationId: ctx.associationId } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.memberAccount.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
