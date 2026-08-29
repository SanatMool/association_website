import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/portalAuth";

export async function GET() {
  const user = await getPortalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [member, association, link] = await Promise.all([
    prisma.member.findUnique({
      where: { id: user.memberId },
      select: { id: true, name: true, nameNe: true, area: true, image: true, email: true, phone: true, phones: true, memberSince: true },
    }),
    prisma.association.findUnique({
      where: { id: user.associationId },
      select: { id: true, name: true, logo: true, foundedYear: true },
    }),
    prisma.memberAssociation.findFirst({
      where: { memberId: user.memberId, associationId: user.associationId },
      include: { memberCategory: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      user,
      member,
      association,
      category: link?.memberCategory?.name ?? null,
    },
  });
}

export async function PUT(req: NextRequest) {
  const user = await getPortalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { phones?: string[]; email?: string };

  const phones = (body.phones ?? []).map((p: string) => p.trim()).filter(Boolean);
  const email  = body.email?.trim() ?? undefined;

  if (email !== undefined && email.length > 0 && !email.includes("@")) {
    return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 });
  }

  const updated = await prisma.member.update({
    where: { id: user.memberId },
    data: {
      ...(phones.length > 0 ? { phones, phone: phones[0] } : {}),
      ...(email !== undefined  ? { email: email || null }  : {}),
    },
    select: { id: true, name: true, phones: true, email: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
