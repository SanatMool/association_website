import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (ctx.systemRole !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.designation.findFirst({
    where: { id: params.id, associationId: ctx.associationId ?? undefined },
  });
  if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    name?: string;
    systemRole?: string;
    permissions?: string[];
    isDefault?: boolean;
    order?: number;
  };

  if (body.systemRole && !["admin", "editor", "member"].includes(body.systemRole)) {
    return NextResponse.json({ success: false, error: "Invalid systemRole" }, { status: 400 });
  }

  const updated = await prisma.designation.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.systemRole !== undefined && { systemRole: body.systemRole }),
      ...(body.permissions !== undefined && { permissions: body.permissions }),
      ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
      ...(body.order !== undefined && { order: body.order }),
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (ctx.systemRole !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.designation.findFirst({
    where: { id: params.id, associationId: ctx.associationId ?? undefined },
    include: { _count: { select: { adminUsers: true } } },
  });
  if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  if (existing._count.adminUsers > 0) {
    return NextResponse.json(
      { success: false, error: "Cannot delete a designation that has users assigned to it." },
      { status: 400 }
    );
  }

  await prisma.designation.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
