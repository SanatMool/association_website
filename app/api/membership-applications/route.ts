import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAssociation } from "@/lib/getAssociation";
import { getAdminContext } from "@/lib/adminAuth";
import { logApiCall } from "@/lib/apiLogger";
import { sendMail } from "@/lib/mailer";

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

    // Fire-and-forget: notify admins + confirm to applicant
    if (association?.id) {
      notifyAdmins(association.id, association.name, body).catch(console.error);
    }
    confirmApplicant(body, association?.name ?? "the association").catch(console.error);

    return NextResponse.json({ success: true, data: application });
  } catch (err) {
    console.error("Membership application error:", err);
    return NextResponse.json({ success: false, error: "Failed to submit application" }, { status: 500 });
  }
}

async function notifyAdmins(
  associationId: string,
  associationName: string,
  app: { venueName: string; ownerName: string; phone: string; email: string; location: string; capacity?: string; website?: string },
) {
  // Get notification email from SiteSettings, fall back to first admin user
  const setting = await prisma.siteSettings.findUnique({
    where: { key_associationId: { key: "admin_notification_email", associationId } },
  });

  let recipients: string[] = [];
  if (setting?.value) {
    recipients = [setting.value];
  } else {
    const admins = await prisma.adminUser.findMany({
      where: { associationId },
      select: { email: true },
    });
    recipients = admins.map((a) => a.email);
  }

  if (recipients.length === 0) return;

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:32px 24px;border-radius:12px;">
      <div style="background:#0a1040;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <h2 style="color:#f59e0b;margin:0;font-size:18px;">New Membership Application</h2>
        <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px;">${associationName} Admin Panel</p>
      </div>
      <div style="background:white;border-radius:8px;padding:24px;border:1px solid #e2e8f0;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#64748b;width:130px;">Venue Name</td><td style="padding:8px 0;font-weight:600;color:#1e293b;">${app.venueName}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Owner</td><td style="padding:8px 0;color:#1e293b;">${app.ownerName}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Phone</td><td style="padding:8px 0;color:#1e293b;">${app.phone}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;color:#1e293b;">${app.email}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Location</td><td style="padding:8px 0;color:#1e293b;">${app.location}</td></tr>
          ${app.capacity ? `<tr><td style="padding:8px 0;color:#64748b;">Capacity</td><td style="padding:8px 0;color:#1e293b;">${app.capacity}</td></tr>` : ""}
          ${app.website ? `<tr><td style="padding:8px 0;color:#64748b;">Website</td><td style="padding:8px 0;color:#1e293b;">${app.website}</td></tr>` : ""}
        </table>
        <div style="margin-top:20px;padding-top:20px;border-top:1px solid #f1f5f9;">
          <a href="${process.env.NEXTAUTH_URL ?? ""}/admin/applications"
            style="display:inline-block;background:#0a1040;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">
            Review Application →
          </a>
        </div>
      </div>
      <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px;">${associationName} · Admin Panel</p>
    </div>
  `;

  await sendMail({
    to: recipients,
    subject: `New membership application — ${app.venueName}`,
    fromName: associationName,
    html,
  });
}

async function confirmApplicant(
  app: { venueName: string; ownerName: string; email: string; location: string; phone: string },
  associationName: string,
) {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:32px 24px;border-radius:12px;">
      <div style="background:#0a1040;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <h2 style="color:#f59e0b;margin:0;font-size:18px;">Application Received</h2>
        <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px;">${associationName}</p>
      </div>
      <div style="background:white;border-radius:8px;padding:24px;border:1px solid #e2e8f0;">
        <p style="color:#1e293b;font-size:14px;margin:0 0 16px;">Dear <strong>${app.ownerName}</strong>,</p>
        <p style="color:#475569;font-size:14px;margin:0 0 16px;">
          Thank you for submitting a membership application for <strong>${app.venueName}</strong>.
          We have received your application and our team will review it shortly.
        </p>
        <p style="color:#475569;font-size:14px;margin:0 0 20px;">
          We will contact you at <strong>${app.email}</strong> or <strong>${app.phone}</strong>
          once your application has been reviewed.
        </p>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;border:1px solid #e2e8f0;">
          <p style="color:#64748b;font-size:12px;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Your Application Details</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr><td style="padding:4px 0;color:#64748b;width:120px;">Venue</td><td style="padding:4px 0;color:#1e293b;font-weight:600;">${app.venueName}</td></tr>
            <tr><td style="padding:4px 0;color:#64748b;">Owner</td><td style="padding:4px 0;color:#1e293b;">${app.ownerName}</td></tr>
            <tr><td style="padding:4px 0;color:#64748b;">Location</td><td style="padding:4px 0;color:#1e293b;">${app.location}</td></tr>
          </table>
        </div>
      </div>
      <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px;">${associationName} · Membership Team</p>
    </div>
  `;

  await sendMail({
    to: app.email,
    subject: `Application received — ${app.venueName}`,
    fromName: associationName,
    html,
  });
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
