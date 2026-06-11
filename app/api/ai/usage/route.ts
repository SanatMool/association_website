import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const AI_DEFAULT_LIMIT = 50;

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!ctx.associationId) return NextResponse.json({ success: false, error: "No association context" }, { status: 400 });
  const associationId: string = ctx.associationId;

  const today = new Date().toISOString().substring(0, 10);
  const [limitSetting, usage] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { key_associationId: { key: "ai_daily_limit", associationId } },
    }),
    prisma.aiUsage.findUnique({
      where: { associationId_date: { associationId, date: today } },
    }),
  ]);

  const limit     = parseInt(limitSetting?.value ?? String(AI_DEFAULT_LIMIT), 10);
  const used      = usage?.count ?? 0;
  const remaining = Math.max(0, limit - used);

  return NextResponse.json({ success: true, data: { used, limit, remaining, date: today } });
}
