import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function PATCH(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberIds, visible } = await req.json() as { memberIds: string[]; visible: boolean };

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return NextResponse.json({ error: "memberIds is required" }, { status: 400 });
  }
  if (typeof visible !== "boolean") {
    return NextResponse.json({ error: "visible must be boolean" }, { status: 400 });
  }

  // Only update links that belong to this association
  const result = await prisma.memberAssociation.updateMany({
    where: {
      memberId:      { in: memberIds },
      associationId: ctx.associationId,
    },
    data: { visible },
  });

  return NextResponse.json({ success: true, updated: result.count });
}
