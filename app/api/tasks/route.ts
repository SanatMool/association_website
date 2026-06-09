import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.adminTask.findMany({
    where: { associationId: ctx.associationId },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(tasks);
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
  return NextResponse.json(task, { status: 201 });
}
