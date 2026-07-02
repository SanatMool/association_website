import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/lib/activityLogger";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json() as { status: string };
  const validStatuses = ["pending", "reviewed", "accepted", "rejected"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const app = await prisma.membershipApplication.findFirst({
    where: { id: params.id, associationId: ctx.associationId ?? undefined },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Accepted is permanently locked — a member record was already created
  if (app.status === "accepted") {
    return NextResponse.json({ error: "Accepted applications cannot be changed." }, { status: 400 });
  }

  // ── ACCEPT: create Member + MemberAssociation in a transaction ──────────
  if (status === "accepted") {
    const baseSlug = slugify(app.venueName);

    // Ensure slug uniqueness by appending a suffix if needed
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.member.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: {
          name:            app.venueName,
          slug,
          area:            app.location,
          phone:           app.phone,
          email:           app.email,
          website:         app.website         ?? null,
          ownerName:       app.ownerName,
          capacity:        app.capacity ? parseInt(app.capacity, 10) || null : null,
          active:          true,
          // Carry over owner personal / legal details from application
          firmRegNo:        app.firmRegNo        ?? null,
          firmType:         app.firmType         ?? null,
          fatherName:       app.fatherName       ?? null,
          grandfatherName:  app.grandfatherName  ?? null,
          spouseName:       app.spouseName       ?? null,
          permWard:         app.permWard         ?? null,
          permTole:         app.permTole         ?? null,
          permMunicipality: app.permMunicipality ?? null,
          permDistrict:     app.permDistrict     ?? null,
          permProvince:     app.permProvince     ?? null,
          tempWard:         app.tempWard         ?? null,
          tempTole:         app.tempTole         ?? null,
          tempMunicipality: app.tempMunicipality ?? null,
          tempDistrict:     app.tempDistrict     ?? null,
          tempProvince:     app.tempProvince     ?? null,
        },
      });

      if (ctx.associationId) {
        await tx.memberAssociation.create({
          data: {
            memberId:      member.id,
            associationId: ctx.associationId!,
          },
        });
      }

      const updated = await tx.membershipApplication.update({
        where: { id: params.id },
        data:  { status: "accepted", memberId: member.id },
      });

      return { member, updated };
    });

  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "application.accept",
    entityType: "application",
    entityId:   params.id,
    entityName: app.venueName,
    meta:       { memberId: result.member.id },
  });
    return NextResponse.json({ success: true, data: result.updated, memberId: result.member.id });
  }

  // ── SIMPLE STATUS UPDATE (pending / reviewed / rejected) ─────────────────
  const updated = await prisma.membershipApplication.update({
    where: { id: params.id },
    data:  { status },
  });

  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     `application.${status}`,
    entityType: "application",
    entityId:   params.id,
    entityName: app.venueName,
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const app = await prisma.membershipApplication.findFirst({
    where: { id: params.id, associationId: ctx.associationId ?? undefined },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.membershipApplication.delete({ where: { id: params.id } });
  logActivity({
    associationId: ctx.associationId,
    adminId:    (ctx.session.user as { id?: string }).id ?? null,
    adminName:  ctx.session.user?.name ?? null,
    action:     "application.delete",
    entityType: "application",
    entityId:   params.id,
    entityName: app.venueName,
  });
  return NextResponse.json({ success: true });
}
