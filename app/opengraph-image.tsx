import { ImageResponse } from "next/og";
import { headers } from "next/headers";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "EVA Nepal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mirrors the hostname-resolution pattern used in /api/admin/branding —
// this file compiles to a route handler, not a React render, so the
// React.cache()-based getAssociation() helper must not be used here
// (see memory: cross-request cache leak risk outside the render tree).
async function resolveAssociation() {
  const headersList = await headers();
  const hostname = headersList.get("x-hostname") ?? "";

  const isLocalDev =
    !hostname ||
    hostname.startsWith("localhost") ||
    hostname.startsWith("127.0.0.1") ||
    hostname.startsWith("::1");

  if (isLocalDev) {
    return prisma.association.findFirst({
      where: { slug: process.env.DEV_ASSOCIATION_SLUG ?? "eva-nepal", active: true },
    });
  }

  const association = await prisma.association.findUnique({ where: { domain: hostname } });
  if (association && !association.active) return null;
  return association;
}

async function loadLogoDataUri(logoPath: string | null | undefined): Promise<string | null> {
  if (!logoPath) return null;
  try {
    const filePath = path.join(process.cwd(), "public", logoPath.replace(/^\//, ""));
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).slice(1) || "png";
    return `data:image/${ext};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const association = await resolveAssociation();

  const name = association?.name ?? "EVA Nepal – Event and Venue Association Nepal";
  const description =
    association?.description ??
    "The official association of event venues, banquet halls and wedding venues in Kathmandu.";
  const logoDataUri = await loadLogoDataUri(association?.logo ?? "/default-logo.png");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0a1040 0%, #131a5c 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "10px",
            background: "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)",
            display: "flex",
          }}
        />
        {logoDataUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoDataUri}
            width={110}
            height={110}
            style={{ objectFit: "contain", marginBottom: 36 }}
            alt=""
          />
        ) : null}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.15,
            maxWidth: 980,
            display: "flex",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#cbd5e1",
            marginTop: 28,
            maxWidth: 900,
            lineHeight: 1.4,
            display: "flex",
          }}
        >
          {description.length > 160 ? `${description.slice(0, 160)}…` : description}
        </div>
      </div>
    ),
    { ...size }
  );
}
