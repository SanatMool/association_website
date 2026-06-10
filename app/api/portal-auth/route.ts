import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encode } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { getAssociation } from "@/lib/getAssociation";

const COOKIE = "member-portal-token";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email: string; password: string };
  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

  const association = await getAssociation();
  if (!association) return NextResponse.json({ error: "Association not found" }, { status: 404 });

  const account = await prisma.memberAccount.findFirst({
    where: { email, associationId: association.id },
    include: { member: { select: { name: true } } },
  });

  if (!account) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const valid = await bcrypt.compare(password, account.passwordHash);
  if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  await prisma.memberAccount.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });

  const token = await encode({
    token: {
      sub:           account.id,
      memberId:      account.memberId,
      associationId: account.associationId,
      email:         account.email,
      name:          account.member.name,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: MAX_AGE,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
