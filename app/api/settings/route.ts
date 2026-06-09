import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const associationId = (session?.user as { associationId?: string | null })?.associationId ?? null;

  const settings = await prisma.siteSettings.findMany({
    where: { associationId },
    orderBy: { group: "asc" },
  });
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const associationId = (session.user as { associationId?: string | null })?.associationId ?? null;
  const body = await req.json();
  const { key, value } = body as { key: string; value: string };
  if (!key) return NextResponse.json({ success: false, error: "key required" }, { status: 400 });

  // Find by composite key (key + associationId)
  const existing = await prisma.siteSettings.findFirst({
    where: { key, associationId },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Setting not found" }, { status: 404 });
  }

  const setting = await prisma.siteSettings.update({
    where: { id: existing.id },
    data: { value, updatedAt: new Date() },
  });

  return NextResponse.json({ success: true, data: setting });
}
