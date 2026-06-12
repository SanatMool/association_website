import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.adminTask.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
    include: {
      subtasks: {
        orderBy: { order: "asc" },
        include: {
          comments: { orderBy: { createdAt: "asc" } },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.adminTask.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, description, status, priority, dueDate, assignee, notes } = body;

  const task = await prisma.adminTask.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(assignee !== undefined && { assignee: assignee?.trim() || null }),
      ...(status === "done" && !existing.completedAt && { completedAt: new Date() }),
    },
  });

  if (status !== undefined && status !== existing.status) {
    await prisma.taskActivity.create({
      data: {
        taskId: params.id,
        action: "status_changed",
        detail: `Status changed from "${existing.status}" to "${status}"`,
        actorName: ctx.session?.user?.name ?? "Admin",
      },
    });
    if (status === "done") {
      logActivity({
        associationId: ctx.associationId,
        adminId:    (ctx.session.user as { id?: string }).id ?? null,
        adminName:  ctx.session.user?.name ?? null,
        action:     "task.complete",
        entityType: "task",
        entityId:   task.id,
        entityName: task.title,
      });
    }
  }

  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.adminTask.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.adminTask.delete({ where: { id: params.id } });
  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "task.delete",
    entityType: "task",
    entityId:   params.id,
    entityName: existing.title,
  });
  return NextResponse.json({ ok: true });
}
