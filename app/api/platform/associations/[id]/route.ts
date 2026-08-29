import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlatformUser } from "@/lib/platformAuth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getPlatformUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const association = await prisma.association.findUnique({ where: { id: params.id } });
  if (!association) return NextResponse.json({ success: false, error: "Association not found" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as { confirmSlug?: string };
  if (body.confirmSlug !== association.slug) {
    return NextResponse.json(
      { success: false, error: "Confirmation slug does not match. Nothing was deleted." },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const associationId = association.id;

      // These models have an OPTIONAL associationId with no onDelete: Cascade in the schema —
      // Prisma/Postgres will not remove them automatically, so they must be deleted explicitly
      // before the Association row itself, or the delete below fails on a FK constraint.
      // AdminUser and CommitteeMember must go first: both also reference Designation via a
      // separate designationId FK (no cascade there either), and Designation cascades away
      // automatically once the Association is deleted below — so any surviving AdminUser/
      // CommitteeMember row pointing at a about-to-vanish Designation would itself violate its
      // own FK. Deleting them here, ahead of time, avoids that ordering problem.
      const [adminUsers, committeeMembers, events, news, siteSettings, applications, apiLogs] = await Promise.all([
        tx.adminUser.deleteMany({ where: { associationId } }),
        tx.committeeMember.deleteMany({ where: { associationId } }),
        tx.event.deleteMany({ where: { associationId } }),
        tx.news.deleteMany({ where: { associationId } }),
        tx.siteSettings.deleteMany({ where: { associationId } }),
        tx.membershipApplication.deleteMany({ where: { associationId } }),
        tx.apiLog.deleteMany({ where: { associationId } }),
      ]);

      // Everything else (MemberAssociation, DuesPayment, Meeting, FinancialYear/Account/
      // JournalEntry, TicketType/Registration, ActivityLog, Designation, MemberAccount,
      // MembershipCategory, AssociationFee, TimelineEntry, MemberGroup, etc.) has
      // onDelete: Cascade on its associationId FK and is removed automatically here.
      // Member rows themselves are NOT deleted — they're the shared multi-tenant entity;
      // only this association's MemberAssociation link to them is removed.
      await tx.association.delete({ where: { id: associationId } });

      return {
        adminUsers: adminUsers.count,
        committeeMembers: committeeMembers.count,
        events: events.count,
        news: news.count,
        siteSettings: siteSettings.count,
        applications: applications.count,
        apiLogs: apiLogs.count,
      };
    });

    console.log(
      `[PLATFORM DELETE] Association "${association.name}" (${association.slug}, id=${association.id}) ` +
      `deleted by platform user ${user.email} (id=${user.id}) at ${new Date().toISOString()}. ` +
      `Explicitly-deleted rows: ${JSON.stringify(result)}`
    );

    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete association";
    console.error(`[PLATFORM DELETE] Failed for association ${association.id}:`, err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getPlatformUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json() as {
      name?: string;
      nameNe?: string;
      slug?: string;
      domain?: string;
      logo?: string;
      foundedYear?: number | null;
      description?: string;
      descriptionNe?: string;
      active?: boolean;
      plan?: string;
    };

    const association = await prisma.association.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json({ success: true, data: association });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update association";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
