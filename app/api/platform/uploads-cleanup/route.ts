import { NextRequest, NextResponse } from "next/server";
import { getPlatformUser } from "@/lib/platformAuth";
import { cleanupOrphanedUploads } from "@/lib/uploadsCleanup";

export async function POST(req: NextRequest) {
  const user = await getPlatformUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { dryRun?: boolean };
  const result = await cleanupOrphanedUploads({ dryRun: body.dryRun !== false });

  return NextResponse.json({ success: true, data: result });
}
