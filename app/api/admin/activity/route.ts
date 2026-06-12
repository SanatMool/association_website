import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const adminId    = searchParams.get("adminId");
  const from       = searchParams.get("from");
  const to         = searchParams.get("to");
  const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit      = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
  const skip       = (page - 1) * limit;

  const where = {
    associationId: ctx.associationId,
    ...(entityType ? { entityType } : {}),
    ...(adminId    ? { adminId }    : {}),
    ...(from || to ? {
      createdAt: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to   ? { lte: new Date(to)   } : {}),
      },
    } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: logs, total, page, pages: Math.ceil(total / limit) });
}
