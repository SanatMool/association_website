import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const news = await prisma.news.findMany({
    where: { associationId },
    orderBy: { publishedAt: "desc" },
  });
  return NextResponse.json(news);
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { publishTime, ...data } = await req.json();
  void publishTime;
  const article = await prisma.news.create({
    data: {
      ...data,
      associationId: ctx.associationId,
      publishedAt: new Date(data.publishedAt ?? Date.now()),
    },
  });
  return NextResponse.json(article, { status: 201 });
}
