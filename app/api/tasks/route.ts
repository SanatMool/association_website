import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.adminTask.findMany({
    where: { associationId: ctx.associationId },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { subtasks: true } },
      subtasks: {
        select: { id: true, status: true },
      },
    },
  });

  const result = tasks.map((t) => ({
    ...t,
    subtaskTotal: t._count.subtasks,
    subtaskDone: t.subtasks.filter((s) => s.status === "done").length,
    subtasks: undefined,
    _count: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, status, priority, dueDate, assignee } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const task = await prisma.adminTask.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      status: status || "todo",
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      assignee: assignee?.trim() || null,
      associationId: ctx.associationId,
    },
  });

  await prisma.taskActivity.create({
    data: {
      taskId: task.id,
      action: "created",
      detail: `Task "${task.title}" created`,
      actorName: ctx.session?.user?.name ?? "Admin",
    },
  });

  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "task.create",
    entityType: "task",
    entityId:   task.id,
    entityName: task.title,
  });

  return NextResponse.json(task, { status: 201 });
}
