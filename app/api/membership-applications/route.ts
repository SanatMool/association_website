import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAssociation } from "@/lib/getAssociation";
import { getAdminContext } from "@/lib/adminAuth";
import { logApiCall } from "@/lib/apiLogger";

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = await req.json() as {
      venueName: string;
      ownerName: string;
      phone: string;
      email: string;
      location: string;
      capacity?: string;
      website?: string;
    };

    if (!body.venueName || !body.ownerName || !body.phone || !body.email || !body.location) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const association = await getAssociation();

    const application = await prisma.membershipApplication.create({
      data: {
        venueName: body.venueName,
        ownerName: body.ownerName,
        phone: body.phone,
        email: body.email,
        location: body.location,
        capacity: body.capacity || null,
        website: body.website || null,
        associationId: association?.id ?? null,
      },
    });

    logApiCall({
      associationId: association?.id ?? null,
      path: new URL(req.url).pathname,
      method: "POST",
      statusCode: 200,
      responseTimeMs: Date.now() - start,
      ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
    });
    return NextResponse.json({ success: true, data: application });
  } catch (err) {
    console.error("Membership application error:", err);
    return NextResponse.json({ success: false, error: "Failed to submit application" }, { status: 500 });
  }
}

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const applications = await prisma.membershipApplication.findMany({
    where: { associationId: ctx.associationId ?? undefined },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}
