import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.siteSettings.findMany({ orderBy: { group: "asc" } });
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { key, value } = body as { key: string; value: string };
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

  const setting = await prisma.siteSettings.update({
    where: { key },
    data: { value, updatedAt: new Date() },
  });
  return NextResponse.json(setting);
}
