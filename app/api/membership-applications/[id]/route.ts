import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { slugify } from "@/lib/utils";

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
          name:      app.venueName,
          slug,
          area:      app.location,
          phone:     app.phone,
          email:     app.email,
          website:   app.website ?? null,
          ownerName: app.ownerName,
          capacity:  app.capacity ? parseInt(app.capacity, 10) || null : null,
          active:    true,
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

    return NextResponse.json({ success: true, data: result.updated, memberId: result.member.id });
  }

  // ── SIMPLE STATUS UPDATE (pending / reviewed / rejected) ─────────────────
  const updated = await prisma.membershipApplication.update({
    where: { id: params.id },
    data:  { status },
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
  return NextResponse.json({ success: true });
}
