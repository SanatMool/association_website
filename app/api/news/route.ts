import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const news = await prisma.news.findMany({
    orderBy: { publishedAt: "desc" },
  });
  return NextResponse.json(news);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const article = await prisma.news.create({
    data: {
      ...data,
      publishedAt: new Date(data.publishedAt ?? Date.now()),
    },
  });
  return NextResponse.json(article, { status: 201 });
}
