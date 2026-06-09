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

  const name = association?.name ?? "EVA Nepal";
  const shortName = name.split(" ")[0];
  const description = association?.description ?? `${name} — official association of event venues.`;
  const themeColor = association?.themeColor ?? "#0a1040";
  const logo = association?.logo ?? "/eva/evanepal_transparent.png";

  const manifest = {
    name,
    short_name: shortName,
    description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: themeColor,
    icons: [
      {
        src: logo,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: logo,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
    },
  });
}
