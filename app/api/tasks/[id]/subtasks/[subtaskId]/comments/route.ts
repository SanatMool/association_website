import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string; subtaskId: string } }
) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.adminTask.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const subtask = await prisma.subtask.findFirst({
    where: { id: params.subtaskId, taskId: params.id },
  });
  if (!subtask) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { text } = body;
  if (!text?.trim()) return NextResponse.json({ error: "Text required" }, { status: 400 });

  const comment = await prisma.subtaskComment.create({
    data: {
      subtaskId: params.subtaskId,
      text: text.trim(),
      authorName: ctx.session?.user?.name ?? "Admin",
    },
  });

  await prisma.taskActivity.create({
    data: {
      taskId: params.id,
      action: "comment_added",
      detail: `Comment added on subtask "${subtask.title}"`,
      actorName: ctx.session?.user?.name ?? "Admin",
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
