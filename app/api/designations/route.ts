import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (ctx.systemRole !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const designations = await prisma.designation.findMany({
    where: { associationId: ctx.associationId ?? undefined },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      systemRole: true,
      permissions: true,
      isDefault: true,
      order: true,
      createdAt: true,
      _count: { select: { adminUsers: true } },
    },
  });

  return NextResponse.json({ success: true, data: designations });
}

export async function POST(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (ctx.systemRole !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  if (!ctx.associationId) {
    return NextResponse.json({ success: false, error: "No association" }, { status: 400 });
  }

  const body = await req.json() as {
    name?: string;
    systemRole?: string;
    permissions?: string[];
    isDefault?: boolean;
    order?: number;
  };

  if (!body.name || !body.systemRole) {
    return NextResponse.json({ success: false, error: "name and systemRole are required" }, { status: 400 });
  }
  if (!["admin", "editor", "member"].includes(body.systemRole)) {
    return NextResponse.json({ success: false, error: "Invalid systemRole" }, { status: 400 });
  }

  const designation = await prisma.designation.create({
    data: {
      associationId: ctx.associationId,
      name: body.name.trim(),
      systemRole: body.systemRole,
      permissions: body.permissions ?? [],
      isDefault: body.isDefault ?? false,
      order: body.order ?? 99,
    },
  });

  return NextResponse.json({ success: true, data: designation }, { status: 201 });
}
