import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET() {
  // Prefer the logged-in admin's own association — this is an admin-scoped endpoint,
  // so we already know exactly which association's branding to show. Falling back to
  // hostname/DEV_ASSOCIATION_SLUG resolution only matters in local dev when multiple
  // test associations share one hostname; without this, every admin locally would see
  // whichever association DEV_ASSOCIATION_SLUG points to, regardless of who's logged in.
  const ctx = await getAdminContext();

  let association = ctx?.associationId
    ? await prisma.association.findUnique({ where: { id: ctx.associationId } })
    : null;

  if (!association) {
    const headersList = await headers();
    const hostname = headersList.get("x-hostname") ?? "";

    const isLocalDev =
      !hostname ||
      hostname.startsWith("localhost") ||
      hostname.startsWith("127.0.0.1") ||
      hostname.startsWith("::1");

    association = isLocalDev
      ? await prisma.association.findFirst({
          where: { slug: process.env.DEV_ASSOCIATION_SLUG ?? "eva-nepal", active: true },
        })
      : await prisma.association.findUnique({ where: { domain: hostname } });
  }

  if (!association) {
    return NextResponse.json({ success: false, error: "Association not found" }, { status: 404 });
  }

  const memberCount = await prisma.memberAssociation.count({
    where: { associationId: association.id, visible: true },
  });

  const yearsActive = association.foundedYear
    ? new Date().getFullYear() - association.foundedYear
    : null;

  return NextResponse.json({
    success: true,
    data: {
      name:        association.name,
      logo:        association.logo ?? null,
      description: association.description ?? null,
      foundedYear: association.foundedYear ?? null,
      yearsActive,
      memberCount,
    },
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
