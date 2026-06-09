import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { visible } = await req.json() as { visible: boolean };

  const link = await prisma.memberAssociation.findUnique({
    where: {
      memberId_associationId: {
        memberId: params.id,
        associationId: ctx.associationId ?? "",
      },
    },
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.memberAssociation.update({
    where: {
      memberId_associationId: {
        memberId: params.id,
        associationId: ctx.associationId ?? "",
      },
    },
    data: { visible },
  });

  return NextResponse.json({ success: true });
}
