import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { slugify } from "@/lib/utils";
import { logApiCall } from "@/lib/apiLogger";

export async function GET(req: NextRequest) {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const { searchParams } = new URL(req.url);
  const featured = searchParams.get("featured");
  const area = searchParams.get("area");
  const limit = searchParams.get("limit");

  const members = await prisma.member.findMany({
    where: {
      associations: { some: { associationId: associationId ?? undefined, visible: true } },
      ...(featured === "true" ? { featured: true } : {}),
      ...(area ? { area } : {}),
    },
    include: {
      associations: {
        where: associationId ? { associationId } : undefined,
        select: { memberCategoryId: true },
      },
    },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    ...(limit ? { take: parseInt(limit) } : {}),
  });

  // Flatten memberCategoryId onto each member for easy client consumption
  const result = members.map((m) => ({
    ...m,
    memberCategoryId: m.associations[0]?.memberCategoryId ?? null,
    associations: undefined, // strip the nested array — callers don't need it
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { associationId } = ctx;

  const rawData = await req.json() as Record<string, unknown>;

  // Extract billing fields — not Member model fields
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { memberCategoryId, billingOption, ...memberData } = rawData;

  // Generate slug if not provided
  if (!memberData.slug && memberData.name) {
    memberData.slug = slugify(memberData.name as string);
  }

  let member;
  try {
    member = await prisma.$transaction(async (tx) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = await tx.member.create({ data: memberData as any });

      if (associationId) {
        await tx.memberAssociation.create({
          data: {
            memberId:         m.id,
            associationId,
            memberCategoryId: (memberCategoryId as string | undefined) || null,
          },
        });
      }

      // Create dues payment if a category is selected and billing isn't skipped
      if (associationId && memberCategoryId && billingOption && billingOption !== "none") {
        const cat = await tx.membershipCategory.findUnique({
          where: { id: memberCategoryId as string },
        });
        if (cat) {
          const now  = new Date();
          const year = now.getFullYear();
          await tx.duesPayment.create({
            data: {
              associationId,
              memberId:         m.id,
              memberCategoryId: cat.id,
              type:             "annual_renewal",
              amount:           cat.annualRenewalFee,
              periodStart:      new Date(`${year}-01-01`),
              periodEnd:        new Date(`${year}-12-31`),
              status:           billingOption === "paid" ? "paid" : "pending",
              method:           "pending",
              paidAt:           billingOption === "paid" ? now : null,
              recordedByAdminId: (ctx.session.user as { id?: string }).id ?? null,
            },
          });
        }
      }

      return m;
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  logApiCall({
    associationId,
    path: new URL(req.url).pathname,
    method: "POST",
    statusCode: 201,
    responseTimeMs: Date.now() - start,
    adminUserId: (ctx.session.user as { id?: string }).id ?? null,
    ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
  });
  return NextResponse.json(member, { status: 201 });
}
