import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getPlatformUser } from "@/lib/platformAuth";
import { DEFAULT_DESIGNATIONS } from "@/lib/permissions";

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
      adminName: string;
      adminEmail: string;
      adminPassword: string;
      memberMode?: string;
    };

    if (!body.name || !body.slug || !body.domain) {
      return NextResponse.json({ success: false, error: "name, slug, and domain are required" }, { status: 400 });
    }
    if (body.memberMode && body.memberMode !== "venue" && body.memberMode !== "person") {
      return NextResponse.json({ success: false, error: "memberMode must be 'venue' or 'person'" }, { status: 400 });
    }
    if (!body.adminName || !body.adminEmail || !body.adminPassword) {
      return NextResponse.json({ success: false, error: "Initial admin name, email, and password are required" }, { status: 400 });
    }
    if (body.adminPassword.length < 8) {
      return NextResponse.json({ success: false, error: "Admin password must be at least 8 characters" }, { status: 400 });
    }
    const existingAdmin = await prisma.adminUser.findUnique({ where: { email: body.adminEmail } });
    if (existingAdmin) {
      return NextResponse.json({ success: false, error: "An admin user with this email already exists" }, { status: 409 });
    }

    const association = await prisma.$transaction(async (tx) => {
      const assoc = await tx.association.create({
        data: {
          name: body.name,
          slug: body.slug,
          domain: body.domain,
          foundedYear: body.foundedYear ?? null,
          description: body.description ?? null,
          plan: body.plan ?? "basic",
        },
      });

      // Create the initial admin login for this association
      const hashedPassword = await bcrypt.hash(body.adminPassword, 10);
      await tx.adminUser.create({
        data: {
          name: body.adminName,
          email: body.adminEmail,
          password: hashedPassword,
          role: "admin",
          systemRole: "admin",
          associationId: assoc.id,
        },
      });

      // Seed default designations for the new association
      await tx.designation.createMany({
        data: DEFAULT_DESIGNATIONS.map((d) => ({
          associationId: assoc.id,
          name: d.name,
          systemRole: d.systemRole,
          permissions: d.permissions,
          isDefault: d.isDefault,
          order: d.order,
        })),
      });

      // Seed default SiteSettings for the new association — all groups the Settings UI
      // exposes, so every tab is editable from day one instead of showing "not configured"
      await tx.siteSettings.createMany({
        data: [
          { key: "member_mode",         value: body.memberMode ?? "venue", label: "Member Mode",         group: "general", associationId: assoc.id },
          { key: "contact_phone",       value: "",  label: "Contact Phone",       group: "contact", associationId: assoc.id },
          { key: "contact_email",       value: "",  label: "Contact Email",       group: "contact", associationId: assoc.id },
          { key: "contact_address",     value: "",  label: "Office Address",      group: "contact", associationId: assoc.id },
          { key: "contact_hours",       value: "",  label: "Office Hours",        group: "contact", associationId: assoc.id },
          { key: "contact_map_url",     value: "",  label: "Map Embed URL",       group: "contact", associationId: assoc.id },
          { key: "social_facebook",     value: "",  label: "Facebook URL",        group: "social",  associationId: assoc.id },
          { key: "social_instagram",    value: "",  label: "Instagram URL",       group: "social",  associationId: assoc.id },
          { key: "social_youtube",      value: "",  label: "YouTube URL",         group: "social",  associationId: assoc.id },
          { key: "stats_events_hosted", value: "0", label: "Events Hosted (stat)", group: "stats",   associationId: assoc.id },
          { key: "footer_tagline",      value: "",  label: "Footer Tagline",      group: "footer",  associationId: assoc.id },
          { key: "hero_image",          value: "",  label: "Hero Background Image URL", group: "hero",   associationId: assoc.id },
          { key: "favicon_image",       value: "",  label: "Favicon Image URL",       group: "assets", associationId: assoc.id },
          { key: "default_member_image", value: "", label: "Default Member Image URL", group: "assets", associationId: assoc.id },
        ],
      });

      // Seed default financial year (current English calendar year)
      const now     = new Date();
      const yearNum = now.getFullYear();
      const fyYear  = await tx.financialYear.create({
        data: {
          associationId:  assoc.id,
          label:          `FY ${yearNum}`,
          startDateAD:    new Date(`${yearNum}-01-01`),
          endDateAD:      new Date(`${yearNum}-12-31`),
          openingBalance: 0,
          status:         "active",
        },
      });
      void fyYear; // seeded; journal entries will reference this year

      // Seed 10 default chart-of-accounts
      await tx.financialAccount.createMany({
        data: [
          { associationId: assoc.id, code: "1001", name: "Cash in Hand",              type: "asset",   isDefault: true, order: 1  },
          { associationId: assoc.id, code: "1002", name: "Bank Account",              type: "asset",   isDefault: true, order: 2  },
          { associationId: assoc.id, code: "1003", name: "Petty Cash",                type: "asset",   isDefault: true, order: 3  },
          { associationId: assoc.id, code: "4001", name: "Membership Dues Income",    type: "income",  isDefault: true, order: 10 },
          { associationId: assoc.id, code: "4002", name: "Event / Ticket Income",     type: "income",  isDefault: true, order: 11 },
          { associationId: assoc.id, code: "4003", name: "Donations & Contributions", type: "income",  isDefault: true, order: 12 },
          { associationId: assoc.id, code: "5001", name: "Meeting & Event Expenses",  type: "expense", isDefault: true, order: 20 },
          { associationId: assoc.id, code: "5002", name: "Administrative Expenses",   type: "expense", isDefault: true, order: 21 },
          { associationId: assoc.id, code: "5003", name: "Printing & Stationery",     type: "expense", isDefault: true, order: 22 },
          { associationId: assoc.id, code: "5004", name: "Food & Refreshments",       type: "expense", isDefault: true, order: 23 },
        ],
      });

      return assoc;
    });

    return NextResponse.json({ success: true, data: association });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create association";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
