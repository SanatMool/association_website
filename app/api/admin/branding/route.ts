import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { hasPermission } from "@/lib/permissions";
import { THEME_PRESETS, DEFAULT_THEME_PRESET } from "@/lib/theme-presets";
import { sanitizeHomepageContent } from "@/lib/homepage-content";
import { getSettings } from "@/lib/settings";
import type { Prisma } from "@prisma/client";

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

  const [memberCount, siteSettings] = await Promise.all([
    prisma.memberAssociation.count({
      where: { associationId: association.id, visible: true },
    }),
    getSettings(association.id),
  ]);

  const yearsActive = association.foundedYear
    ? new Date().getFullYear() - association.foundedYear
    : null;

  const hqLocation = siteSettings.contact_address?.split("\n")[0] || "Kathmandu";

  return NextResponse.json({
    success: true,
    data: {
      name:        association.name,
      logo:        association.logo ?? null,
      description: association.description ?? null,
      foundedYear: association.foundedYear ?? null,
      yearsActive,
      memberCount,
      hqLocation,
      colorPreset: association.colorPreset ?? DEFAULT_THEME_PRESET,
      homepageContent: sanitizeHomepageContent(association.homepageContent),
    },
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(ctx, "settings.manage")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  if (!ctx.associationId) {
    return NextResponse.json({ success: false, error: "No association context" }, { status: 400 });
  }

  const body = await req.json();
  const { colorPreset, homepageContent, logo } = body as { colorPreset?: string; homepageContent?: unknown; logo?: string | null };

  if (colorPreset === undefined && homepageContent === undefined && logo === undefined) {
    return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
  }

  const data: Prisma.AssociationUpdateInput = {};

  if (logo !== undefined) {
    data.logo = typeof logo === "string" && logo.trim() ? logo.trim().slice(0, 500) : null;
  }

  if (colorPreset !== undefined) {
    if (!(colorPreset in THEME_PRESETS)) {
      return NextResponse.json({ success: false, error: "Invalid color preset" }, { status: 400 });
    }
    const preset = THEME_PRESETS[colorPreset];
    data.colorPreset = colorPreset;
    // Kept in sync so the PWA manifest routes and viewport theme-color, which read these
    // two fields directly, reflect the new preset without any changes to their own code.
    data.themeColor = preset.primary[800];
    data.accentColor = preset.accent[500];
  }

  if (homepageContent !== undefined) {
    data.homepageContent = sanitizeHomepageContent(homepageContent) as Prisma.InputJsonValue;
  }

  const association = await prisma.association.update({
    where: { id: ctx.associationId },
    data,
  });

  return NextResponse.json({
    success: true,
    data: {
      logo: association.logo ?? null,
      colorPreset: association.colorPreset,
      homepageContent: sanitizeHomepageContent(association.homepageContent),
    },
  });
}
