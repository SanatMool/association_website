import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx?.associationId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.timelineEntry.findMany({
    where: { associationId: ctx.associationId },
    orderBy: [{ order: "asc" }, { year: "asc" }],
  });

  return NextResponse.json({ success: true, data: entries });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx?.associationId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

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
    const entry = await prisma.timelineEntry.create({
      data: {
        associationId: ctx.associationId,
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
    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/timeline]", err);
    return NextResponse.json({ success: false, error: "Failed to create entry" }, { status: 500 });
  }
}
