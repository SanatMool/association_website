import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

// PATCH /api/membership/member-category/[memberId] — assign category to member
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberCategoryId } = await req.json() as { memberCategoryId: string | null };

  const link = await prisma.memberAssociation.findUnique({
    where: { memberId_associationId: { memberId: params.id, associationId: ctx.associationId } },
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.memberAssociation.update({
    where: { memberId_associationId: { memberId: params.id, associationId: ctx.associationId } },
    data: { memberCategoryId: memberCategoryId || null },
  });

  return NextResponse.json({ success: true });
}
