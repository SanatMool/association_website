import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { logActivity } from "@/lib/activityLogger";

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
  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "news.create",
    entityType: "news",
    entityId:   article.id,
    entityName: article.title,
  });
  return NextResponse.json(article, { status: 201 });
}
