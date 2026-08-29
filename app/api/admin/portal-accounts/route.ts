import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // All members for this association with their portal account status
  const links = await prisma.memberAssociation.findMany({
    where: { associationId: ctx.associationId },
    include: {
      member: {
        select: {
          id: true, name: true, area: true,
          portalAccounts: {
            where: { associationId: ctx.associationId },
            select: { id: true, email: true, createdAt: true, emailFailedAt: true, emailError: true },
          },
        },
      },
    },
    orderBy: { member: { name: "asc" } },
  });

  const data = links.map((l) => ({
    memberId:   l.member.id,
    memberName: l.member.name,
    area:       l.member.area ?? "",
    account:    l.member.portalAccounts[0] ?? null,
  }));

  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId, email, password } = await req.json() as { memberId: string; email: string; password: string };
  if (!memberId || !email || !password) return NextResponse.json({ success: false, error: "memberId, email and password required" }, { status: 400 });

  // Verify member belongs to this association
  const link = await prisma.memberAssociation.findUnique({
    where: { memberId_associationId: { memberId, associationId: ctx.associationId } },
  });
  if (!link) return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });

  const existing = await prisma.memberAccount.findFirst({ where: { memberId, associationId: ctx.associationId } });
  if (existing) return NextResponse.json({ success: false, error: "Portal account already exists for this member" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const account = await prisma.memberAccount.create({
    data: { memberId, associationId: ctx.associationId, email, passwordHash },
  });

  return NextResponse.json({ success: true, data: { id: account.id, email: account.email } });
}
