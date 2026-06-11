import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.adminTask.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, assignee } = body;
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const count = await prisma.subtask.count({ where: { taskId: params.id } });
  const subtask = await prisma.subtask.create({
    data: {
      taskId: params.id,
      title: title.trim(),
      assignee: assignee?.trim() || null,
      order: count,
    },
    include: { comments: true },
  });

  await prisma.taskActivity.create({
    data: {
      taskId: params.id,
      action: "subtask_added",
      detail: `Subtask "${subtask.title}" added`,
      actorName: ctx.session?.user?.name ?? "Admin",
    },
  });

  return NextResponse.json(subtask, { status: 201 });
}
