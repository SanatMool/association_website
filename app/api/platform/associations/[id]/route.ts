import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlatformUser } from "@/lib/platformAuth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getPlatformUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json() as {
      name?: string;
      nameNe?: string;
      slug?: string;
      domain?: string;
      logo?: string;
      foundedYear?: number | null;
      description?: string;
      descriptionNe?: string;
      active?: boolean;
      plan?: string;
    };

    const association = await prisma.association.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json({ success: true, data: association });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update association";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
