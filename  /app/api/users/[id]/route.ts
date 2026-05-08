import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const all = await prisma.adminUser.count();
  if (all <= 1) {
    return NextResponse.json({ error: "Cannot delete the last admin user" }, { status: 400 });
  }
  await prisma.adminUser.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
