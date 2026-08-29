import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const DEV_FALLBACK_SLUG = process.env.DEV_ASSOCIATION_SLUG ?? "eva-nepal";

export async function GET() {
  const headersList = await headers();
  const hostname = headersList.get("x-hostname") ?? "";

  const isLocalDev =
    !hostname ||
    hostname.startsWith("localhost") ||
    hostname.startsWith("127.0.0.1") ||
    hostname.startsWith("::1");

  const association = isLocalDev
    ? await prisma.association.findFirst({ where: { slug: DEV_FALLBACK_SLUG, active: true } })
    : await prisma.association.findUnique({ where: { domain: hostname } });

  const name = association?.name ?? "Member Portal";
  const shortName = `${name.split(" ")[0]} Portal`;
  const themeColor = association?.themeColor ?? "#0a1040";
  const logo = association?.logo ?? "/default-logo.png";

  const manifest = {
    name: `${name} Portal`,
    short_name: shortName,
    description: `Member portal for ${name}.`,
    start_url: "/portal",
    scope: "/portal",
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
