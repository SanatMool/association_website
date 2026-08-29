import { NextResponse } from "next/server";

// Platform panel is Nibjar's own operator tool, not tenant-branded — fixed identity,
// no per-association resolution (unlike /api/manifest, /api/manifest/admin, /api/manifest/portal).
export async function GET() {
  const manifest = {
    name: "Nibjar Platform",
    short_name: "Nibjar",
    description: "Nibjar association platform — operator panel.",
    start_url: "/platform/dashboard",
    scope: "/platform",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#312e81",
    categories: ["business"],
    icons: [
      { src: "/nibjar/nibjar_purple_logo.png", sizes: "251x251", type: "image/png", purpose: "any" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
