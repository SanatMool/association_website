import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.systemRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.adminUser.findMany({
    where: { associationId: ctx.associationId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      systemRole: true,
      createdAt: true,
      designation: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.systemRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as {
    name?: string;
    email?: string;
    password?: string;
    systemRole?: string;
    designationId?: string;
  };

  const { name, email, password, systemRole = "admin", designationId } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email and password required" }, { status: 400 });
  }
  if (!["admin", "editor", "member"].includes(systemRole)) {
    return NextResponse.json({ error: "Invalid systemRole" }, { status: 400 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  // Validate designationId belongs to this association
  if (designationId) {
    const des = await prisma.designation.findFirst({
      where: { id: designationId, associationId: ctx.associationId ?? undefined },
    });
    if (!des) {
      return NextResponse.json({ error: "Invalid designation" }, { status: 400 });
    }
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.create({
    data: {
      name,
      email,
      password: hashed,
      role: systemRole,
      systemRole,
      designationId: designationId ?? null,
      associationId: ctx.associationId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      systemRole: true,
      createdAt: true,
      designation: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(user, { status: 201 });
}
