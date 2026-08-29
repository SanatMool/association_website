import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.systemRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify target user belongs to this association
  const target = await prisma.adminUser.findFirst({
    where: { id: params.id, associationId: ctx.associationId, deletedAt: null },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    systemRole?: string;
    designationId?: string | null;
    password?: string;
  };

  // Guard: cannot change own role if it would demote self
  if (
    params.id === ctx.adminId &&
    body.systemRole &&
    body.systemRole !== "admin"
  ) {
    // Check if this person is the last active admin
    const activeAdminCount = await prisma.adminUser.count({
      where: { associationId: ctx.associationId, systemRole: "admin", deletedAt: null },
    });
    if (activeAdminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot demote the last active admin." },
        { status: 400 }
      );
    }
  }

  if (body.systemRole && !["admin", "editor", "member"].includes(body.systemRole)) {
    return NextResponse.json({ error: "Invalid systemRole" }, { status: 400 });
  }

  // Validate designationId
  if (body.designationId) {
    const des = await prisma.designation.findFirst({
      where: { id: body.designationId, associationId: ctx.associationId ?? undefined },
    });
    if (!des) return NextResponse.json({ error: "Invalid designation" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.systemRole !== undefined) {
    updateData.systemRole = body.systemRole;
    updateData.role = body.systemRole; // keep legacy field in sync
  }
  if ("designationId" in body) {
    updateData.designationId = body.designationId ?? null;
  }
  if (body.password) {
    updateData.password = await bcrypt.hash(body.password, 10);
  }

  const updated = await prisma.adminUser.update({
    where: { id: params.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      systemRole: true,
      designation: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.systemRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify target belongs to this association
  const target = await prisma.adminUser.findFirst({
    where: { id: params.id, associationId: ctx.associationId, deletedAt: null },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Last-admin guard — count active admins with systemRole = "admin"
  const activeAdminCount = await prisma.adminUser.count({
    where: { associationId: ctx.associationId, systemRole: "admin", deletedAt: null },
  });
  if (target.systemRole === "admin" && activeAdminCount <= 1) {
    return NextResponse.json({ error: "Cannot delete the last active admin." }, { status: 400 });
  }

  // Soft delete — preserve for financial record integrity
  await prisma.adminUser.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
