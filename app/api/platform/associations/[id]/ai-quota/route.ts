import { NextRequest, NextResponse } from "next/server";
import { getPlatformUser } from "@/lib/platformAuth";
import { prisma } from "@/lib/prisma";

const AI_DEFAULT_LIMIT = 50;

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getPlatformUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().substring(0, 10);
  const associationId = params.id;

  const [limitSetting, enabledSetting, usage] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { key_associationId: { key: "ai_daily_limit", associationId } },
    }),
    prisma.siteSettings.findUnique({
      where: { key_associationId: { key: "ai_enabled", associationId } },
    }),
    prisma.aiUsage.findUnique({
      where: { associationId_date: { associationId, date: today } },
    }),
  ]);

  const limit     = parseInt(limitSetting?.value ?? String(AI_DEFAULT_LIMIT), 10);
  const used      = usage?.count ?? 0;
  const remaining = Math.max(0, limit - used);
  const enabled   = enabledSetting?.value !== "false";

  return NextResponse.json({ success: true, data: { used, limit, remaining, date: today, enabled } });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getPlatformUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const associationId = params.id;
  const body = await req.json() as { action: "set_limit" | "reset_today" | "toggle_enabled"; limit?: number; enabled?: boolean };

  if (body.action === "set_limit") {
    const limit = Number(body.limit);
    if (!Number.isInteger(limit) || limit < 0) {
      return NextResponse.json({ success: false, error: "limit must be a non-negative integer" }, { status: 400 });
    }
    await prisma.siteSettings.upsert({
      where:  { key_associationId: { key: "ai_daily_limit", associationId } },
      create: { key: "ai_daily_limit", value: String(limit), label: "AI Daily Generation Limit", group: "ai", associationId },
      update: { value: String(limit) },
    });
    return NextResponse.json({ success: true, data: { limit } });
  }

  if (body.action === "reset_today") {
    const today = new Date().toISOString().substring(0, 10);
    await prisma.aiUsage.updateMany({
      where: { associationId, date: today },
      data:  { count: 0 },
    });
    return NextResponse.json({ success: true, data: { reset: true } });
  }

  if (body.action === "toggle_enabled") {
    const enabled = body.enabled === true;
    await prisma.siteSettings.upsert({
      where:  { key_associationId: { key: "ai_enabled", associationId } },
      create: { key: "ai_enabled", value: String(enabled), label: "AI Generation Enabled", group: "ai", associationId },
      update: { value: String(enabled) },
    });
    return NextResponse.json({ success: true, data: { enabled } });
  }

  return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
}
