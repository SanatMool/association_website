import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json() as { status: string };
  const validStatuses = ["pending", "reviewed", "accepted", "rejected"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const app = await prisma.membershipApplication.findFirst({
    where: { id: params.id, associationId: ctx.associationId ?? undefined },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.membershipApplication.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const app = await prisma.membershipApplication.findFirst({
    where: { id: params.id, associationId: ctx.associationId ?? undefined },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.membershipApplication.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
