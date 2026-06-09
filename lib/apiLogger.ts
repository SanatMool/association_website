import { prisma } from "@/lib/prisma";

interface ApiLogEntry {
  associationId?: string | null;
  path: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  adminUserId?: string | null;
  ip?: string | null;
  errorMessage?: string | null;
}

/**
 * logApiCall — fire-and-forget ApiLog writer.
 * Never throws — logging failures must never break the API response.
 */
export function logApiCall(entry: ApiLogEntry): void {
  prisma.apiLog.create({ data: entry }).catch(() => {
    // silently ignore — logging must never affect the response
  });
}
