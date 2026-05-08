import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const featured = searchParams.get("featured");
  const area = searchParams.get("area");
  const limit = searchParams.get("limit");

  const members = await prisma.member.findMany({
    where: {
      ...(featured === "true" ? { featured: true } : {}),
      ...(area ? { area } : {}),
    },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    ...(limit ? { take: parseInt(limit) } : {}),
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const member = await prisma.member.create({ data });
  return NextResponse.json(member, { status: 201 });
}
