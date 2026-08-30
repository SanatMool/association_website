import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

// Every uploaded image is re-encoded to WebP and capped at this max dimension (longest side) —
// keeps the server's disk/memory footprint predictable regardless of what a member's phone
// camera or a downloaded flyer produces. 1920px covers every place this app renders an image
// (hero backgrounds, event banners) with room to spare; nothing needs the original resolution.
const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 80;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB raw-file ceiling, before compression — comfortably covers a real phone photo while keeping memory/CPU use bounded on a small VPS

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 15MB)" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const inputBuffer = Buffer.from(bytes);

  let outputBuffer: Buffer;
  try {
    outputBuffer = await sharp(inputBuffer)
      .rotate() // apply EXIF orientation before resizing, then strip metadata below
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "Couldn't process this image. Try a different file." }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const baseName = file.name.replace(/\.[^./]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_") || "image";
  const filename = `${Date.now()}-${baseName}.webp`;
  const filepath = path.join(uploadsDir, filename);

  await writeFile(filepath, outputBuffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
