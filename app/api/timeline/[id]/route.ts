import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx?.associationId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.timelineEntry.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { year, title, titleNe, description, descriptionNe, stat, highlighted, order } = body as Record<string, unknown>;

  if (!year || !title || !description) {
    return NextResponse.json({ success: false, error: "year, title, and description are required" }, { status: 400 });
  }

  try {
    const entry = await prisma.timelineEntry.update({
      where: { id: params.id },
      data: {
        year: Number(year),
        title: String(title).trim(),
        titleNe: titleNe ? String(titleNe).trim() || null : null,
        description: String(description).trim(),
        descriptionNe: descriptionNe ? String(descriptionNe).trim() || null : null,
        stat: stat ? String(stat).trim() || null : null,
        highlighted: Boolean(highlighted),
        order: Number(order) || 0,
      },
    });
    return NextResponse.json({ success: true, data: entry });
  } catch (err) {
    console.error("[PUT /api/timeline/[id]]", err);
    return NextResponse.json({ success: false, error: "Failed to update entry" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx?.associationId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.timelineEntry.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
  });
  if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  try {
    await prisma.timelineEntry.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, data: null });
  } catch (err) {
    console.error("[DELETE /api/timeline/[id]]", err);
    return NextResponse.json({ success: false, error: "Failed to delete entry" }, { status: 500 });
  }
}
