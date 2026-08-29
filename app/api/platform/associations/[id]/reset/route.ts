import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlatformUser } from "@/lib/platformAuth";
import type { PrismaClient } from "@prisma/client";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

// Each handler deletes one "module" worth of data for a single association, returning a row count.
// Order within a handler matters where a non-cascading FK exists (see [[database-patterns]] memory
// "Association Delete Cascade Map" for the underlying schema audit — this reuses the same findings).
const MODULE_HANDLERS: Record<string, (tx: Tx, associationId: string) => Promise<number>> = {
  applications: async (tx, associationId) =>
    (await tx.membershipApplication.deleteMany({ where: { associationId } })).count,

  events: async (tx, associationId) =>
    (await tx.event.deleteMany({ where: { associationId } })).count, // cascades EventRsvp, TicketRegistration

  news: async (tx, associationId) =>
    (await tx.news.deleteMany({ where: { associationId } })).count,

  committee: async (tx, associationId) =>
    (await tx.committeeMember.deleteMany({ where: { associationId } })).count,

  timeline: async (tx, associationId) =>
    (await tx.timelineEntry.deleteMany({ where: { associationId } })).count,

  meetings: async (tx, associationId) =>
    (await tx.meeting.deleteMany({ where: { associationId } })).count, // cascades AgendaItem, MeetingMinutes, MeetingRsvp, MeetingAttendance

  tasks: async (tx, associationId) =>
    (await tx.adminTask.deleteMany({ where: { associationId } })).count, // cascades TaskActivity

  activity: async (tx, associationId) => {
    const a = await tx.activityLog.deleteMany({ where: { associationId } });
    const b = await tx.apiLog.deleteMany({ where: { associationId } });
    return a.count + b.count;
  },

  dues: async (tx, associationId) =>
    (await tx.duesPayment.deleteMany({ where: { associationId } })).count,

  financial: async (tx, associationId) => {
    // Order matters: JournalEntry/Expense reference FinancialAccount/ExpenseVendor without a cascade,
    // so the referencing rows must go first.
    const j  = await tx.journalEntry.deleteMany({ where: { associationId } });
    const e  = await tx.expense.deleteMany({ where: { associationId } });
    const v  = await tx.expenseVendor.deleteMany({ where: { associationId } });
    const c  = await tx.memberContribution.deleteMany({ where: { associationId } });
    const fy = await tx.financialYear.deleteMany({ where: { associationId } });
    const fa = await tx.financialAccount.deleteMany({ where: { associationId } });
    return j.count + e.count + v.count + c.count + fy.count + fa.count;
  },

  portalAccounts: async (tx, associationId) =>
    (await tx.memberAccount.deleteMany({ where: { associationId } })).count,

  // Must run LAST (after committee/applications, if also selected this run) — Member is the
  // shared multi-tenant entity, never deleted directly. This only unlinks this association, then
  // deletes any Member row left with zero remaining references anywhere (MemberAssociation,
  // CommitteeMember.memberId, MembershipApplication.memberId — the only two non-cascading FKs to
  // Member — see [[database-patterns]]). A Member still linked to another association, or still
  // referenced by a CommitteeMember/MembershipApplication row the admin chose NOT to clear this
  // run, is safely left alone.
  members: async (tx, associationId) => {
    const candidates = await tx.memberAssociation.findMany({
      where: { associationId },
      select: { memberId: true },
    });
    const candidateIds = candidates.map((c) => c.memberId);
    const unlinked = await tx.memberAssociation.deleteMany({ where: { associationId } });

    if (candidateIds.length === 0) return unlinked.count;

    const stillReferenced = await tx.member.findMany({
      where: {
        id: { in: candidateIds },
        OR: [
          { associations: { some: {} } },
          { committeeMemberships: { some: {} } },
          { membershipApplications: { some: {} } },
        ],
      },
      select: { id: true },
    });
    const stillReferencedIds = new Set(stillReferenced.map((m) => m.id));
    const safeToDeleteIds = candidateIds.filter((id) => !stillReferencedIds.has(id));

    if (safeToDeleteIds.length > 0) {
      await tx.member.deleteMany({ where: { id: { in: safeToDeleteIds } } });
    }
    return unlinked.count;
  },
};

const MODULE_ORDER = [
  "applications", "events", "news", "committee", "timeline", "meetings",
  "tasks", "activity", "dues", "financial", "portalAccounts", "members",
];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getPlatformUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const association = await prisma.association.findUnique({ where: { id: params.id } });
  if (!association) return NextResponse.json({ success: false, error: "Association not found" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as { modules?: string[]; confirmSlug?: string };
  if (body.confirmSlug !== association.slug) {
    return NextResponse.json(
      { success: false, error: "Confirmation slug does not match. Nothing was deleted." },
      { status: 400 }
    );
  }

  const requested = (body.modules ?? []).filter((m) => m in MODULE_HANDLERS);
  if (requested.length === 0) {
    return NextResponse.json({ success: false, error: "No valid modules selected." }, { status: 400 });
  }

  try {
    const results: Record<string, number> = {};
    await prisma.$transaction(async (tx) => {
      for (const key of MODULE_ORDER) {
        if (!requested.includes(key)) continue;
        results[key] = await MODULE_HANDLERS[key](tx as unknown as Tx, association.id);
      }
    });

    console.log(
      `[PLATFORM RESET] Association "${association.name}" (${association.slug}) data reset by ` +
      `platform user ${user.email} (id=${user.id}) at ${new Date().toISOString()}. ` +
      `Modules: ${requested.join(", ")}. Deleted counts: ${JSON.stringify(results)}`
    );

    return NextResponse.json({ success: true, data: results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reset association data";
    console.error(`[PLATFORM RESET] Failed for association ${association.id}:`, err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
