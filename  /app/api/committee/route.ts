import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const committee = await prisma.committeeMember.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(committee);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const member = await prisma.committeeMember.create({ data });
  return NextResponse.json(member, { status: 201 });
}
