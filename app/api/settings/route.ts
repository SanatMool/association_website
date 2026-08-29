import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const settings = await prisma.siteSettings.findMany({
    where: { associationId },
    orderBy: { group: "asc" },
  });
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(ctx, "settings.manage")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const associationId = ctx.associationId;
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
