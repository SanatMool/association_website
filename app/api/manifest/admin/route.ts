import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

const DEV_FALLBACK_SLUG = process.env.DEV_ASSOCIATION_SLUG ?? "eva-nepal";

export async function GET() {
  // Prefer the logged-in admin's own association (same reasoning as /api/admin/branding —
  // this is an admin-scoped surface, so we already know exactly which association it's for).
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
      ? await prisma.association.findFirst({ where: { slug: DEV_FALLBACK_SLUG, active: true } })
      : await prisma.association.findUnique({ where: { domain: hostname } });
  }

  const name = association?.name ?? "Admin Panel";
  const shortName = `${name.split(" ")[0]} Admin`;
  const themeColor = association?.themeColor ?? "#0a1040";
  const logo = association?.logo ?? "/default-logo.png";

  const manifest = {
    name: `${name} Admin`,
    short_name: shortName,
    description: `Admin panel for ${name}.`,
    start_url: "/admin/dashboard",
    scope: "/admin",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: themeColor,
    categories: ["business"],
    icons: [
      { src: logo, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: logo, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: logo, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
