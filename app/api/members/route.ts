import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const { searchParams } = new URL(req.url);
  const featured = searchParams.get("featured");
  const area = searchParams.get("area");
  const limit = searchParams.get("limit");

  const members = await prisma.member.findMany({
    where: {
      associations: { some: { associationId, visible: true } },
      ...(featured === "true" ? { featured: true } : {}),
      ...(area ? { area } : {}),
    },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    ...(limit ? { take: parseInt(limit) } : {}),
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { associationId } = ctx;

  const data = await req.json();

  // Generate slug if not provided
  if (!data.slug && data.name) {
    data.slug = slugify(data.name);
  }

  const member = await prisma.$transaction(async (tx) => {
    const m = await tx.member.create({ data });
    if (associationId) {
      await tx.memberAssociation.create({
        data: { memberId: m.id, associationId },
      });
    }
    return m;
  });

  return NextResponse.json(member, { status: 201 });
}
