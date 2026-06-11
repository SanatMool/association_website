import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string; subtaskId: string; commentId: string } }
) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.adminTask.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { text } = body;
  if (!text?.trim()) return NextResponse.json({ error: "Text required" }, { status: 400 });

  const comment = await prisma.subtaskComment.update({
    where: { id: params.commentId },
    data: { text: text.trim() },
  });

  return NextResponse.json(comment);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; subtaskId: string; commentId: string } }
) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.adminTask.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.subtaskComment.delete({ where: { id: params.commentId } });
  return NextResponse.json({ ok: true });
}
