import { NextRequest, NextResponse } from "next/server";
import { getPlatformUser } from "@/lib/platformAuth";
import { cleanupOrphanedUploads, mergeDuplicateUploads } from "@/lib/uploadsCleanup";

export async function POST(req: NextRequest) {
  const user = await getPlatformUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { dryRun?: boolean; mode?: "orphans" | "duplicates" };
  const dryRun = body.dryRun !== false;

  const result = body.mode === "duplicates"
    ? await mergeDuplicateUploads({ dryRun })
    : await cleanupOrphanedUploads({ dryRun });

  return NextResponse.json({ success: true, data: result });
}
