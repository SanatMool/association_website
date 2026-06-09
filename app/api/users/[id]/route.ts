import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Count only users in this association before allowing delete
  const count = await prisma.adminUser.count({
    where: { associationId: ctx.associationId },
  });
  if (count <= 1) {
    return NextResponse.json({ error: "Cannot delete the last admin user" }, { status: 400 });
  }

  // Verify user belongs to this association
  const user = await prisma.adminUser.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.adminUser.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
