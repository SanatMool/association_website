import { prisma } from "@/lib/prisma";

export interface LogActivityInput {
  associationId: string | null;
  adminId?: string | null;
  adminName?: string | null;
  action: string;          // e.g. "member.create"
  entityType: string;      // "member" | "event" | "news" | "committee" | "meeting" | "application" | "dues" | "task"
  entityId?: string | null;
  entityName?: string | null;
  meta?: Record<string, unknown> | null;
}

/**
 * Fire-and-forget activity logger. Call without await in API routes.
 * Silently swallows errors — never block the main request.
 */
export function logActivity(input: LogActivityInput): void {
  if (!input.associationId) return;

  prisma.activityLog
    .create({
      data: {
        associationId: input.associationId,
        adminId:       input.adminId    ?? null,
        adminName:     input.adminName  ?? null,
        action:        input.action,
        entityType:    input.entityType,
        entityId:      input.entityId   ?? null,
        entityName:    input.entityName ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        meta:          (input.meta ?? undefined) as any,
      },
    })
    .catch(console.error);
}
