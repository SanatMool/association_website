import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendors = await prisma.expenseVendor.findMany({
    where: { associationId: ctx.associationId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: vendors });
}
