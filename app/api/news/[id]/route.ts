import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const article = await prisma.news.findUnique({ where: { id: params.id } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(article);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.news.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await req.json();
  const article = await prisma.news.update({
    where: { id: params.id },
    data: { ...data, publishedAt: new Date(data.publishedAt) },
  });
  return NextResponse.json(article);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.news.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.news.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
