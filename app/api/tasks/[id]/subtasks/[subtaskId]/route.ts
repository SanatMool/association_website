import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string; subtaskId: string } }
) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.adminTask.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.subtask.findFirst({
    where: { id: params.subtaskId, taskId: params.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, assignee, status } = body;

  const subtask = await prisma.subtask.update({
    where: { id: params.subtaskId },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(assignee !== undefined && { assignee: assignee?.trim() || null }),
      ...(status !== undefined && { status }),
      ...(status === "done" && !existing.completedAt && { completedAt: new Date() }),
      ...(status === "todo" && { completedAt: null }),
    },
    include: { comments: { orderBy: { createdAt: "asc" } } },
  });

  if (status !== undefined && status !== existing.status) {
    await prisma.taskActivity.create({
      data: {
        taskId: params.id,
        action: status === "done" ? "subtask_done" : "subtask_reopened",
        detail: `Subtask "${subtask.title}" marked as ${status === "done" ? "done" : "to do"}`,
        actorName: ctx.session?.user?.name ?? "Admin",
      },
    });

    // Auto-complete parent task when all subtasks done
    if (status === "done" && task.status !== "done") {
      const remaining = await prisma.subtask.count({
        where: { taskId: params.id, status: { not: "done" } },
      });
      if (remaining === 0) {
        await prisma.adminTask.update({
          where: { id: params.id },
          data: { status: "done", completedAt: task.completedAt ?? new Date() },
        });
        await prisma.taskActivity.create({
          data: {
            taskId: params.id,
            action: "status_changed",
            detail: "All subtasks completed — task auto-completed",
            actorName: "System",
          },
        });
      }
    }
  }

  return NextResponse.json(subtask);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; subtaskId: string } }
) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.adminTask.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.subtask.findFirst({
    where: { id: params.subtaskId, taskId: params.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.subtask.delete({ where: { id: params.subtaskId } });

  await prisma.taskActivity.create({
    data: {
      taskId: params.id,
      action: "subtask_deleted",
      detail: `Subtask "${existing.title}" deleted`,
      actorName: ctx.session?.user?.name ?? "Admin",
    },
  });

  return NextResponse.json({ ok: true });
}
