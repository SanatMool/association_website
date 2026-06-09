import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlatformUser } from "@/lib/platformAuth";

export async function POST(req: NextRequest) {
  const user = await getPlatformUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json() as {
      name: string;
      slug: string;
      domain: string;
      foundedYear?: number;
      description?: string;
      plan?: string;
    };

    if (!body.name || !body.slug || !body.domain) {
      return NextResponse.json({ success: false, error: "name, slug, and domain are required" }, { status: 400 });
    }

    const association = await prisma.association.create({
      data: {
        name: body.name,
        slug: body.slug,
        domain: body.domain,
        foundedYear: body.foundedYear ?? null,
        description: body.description ?? null,
        plan: body.plan ?? "basic",
      },
    });

    return NextResponse.json({ success: true, data: association });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create association";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
