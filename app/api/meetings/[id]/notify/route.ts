import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { sendMail } from "@/lib/mailer";
import { formatDate } from "@/lib/utils";
import { logActivity } from "@/lib/activityLogger";
import { recordEmailResult } from "@/lib/emailFailureTracking";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meeting = await prisma.meeting.findFirst({
    where: { id: params.id, associationId: ctx.associationId },
    include: {
      minutes:     { select: { publishedAt: true, content: true } },
      agendaItems: { orderBy: { order: "asc" }, select: { title: true, resolved: true, outcome: true } },
    },
  });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as { type: "meeting_notice" | "minutes_published"; customMessage?: string };
  if (!body.type) return NextResponse.json({ success: false, error: "type required" }, { status: 400 });

  const assoc = await prisma.association.findUnique({
    where: { id: ctx.associationId },
    select: { name: true, domain: true },
  });
  if (!assoc) return NextResponse.json({ error: "Association not found" }, { status: 404 });

  // Collect all member emails with portal accounts
  const accounts = await prisma.memberAccount.findMany({
    where: { associationId: ctx.associationId },
    select: { id: true, email: true, member: { select: { name: true } } },
  });

  if (accounts.length === 0) {
    return NextResponse.json({ success: false, error: "No portal accounts found to notify" }, { status: 400 });
  }

  const dateStr = formatDate(meeting.scheduledAt.toISOString());
  const domain = `https://${assoc.domain}`;

  let subject = "";
  let html = "";

  if (body.type === "meeting_notice") {
    subject = `Meeting Notice: ${meeting.title} — ${dateStr}`;
    const agendaHtml = meeting.agendaItems.length > 0
      ? `<ol style="margin:0;padding-left:1.2em;color:#374151">${meeting.agendaItems.map((a) => `<li style="margin-bottom:6px">${a.title}</li>`).join("")}</ol>`
      : "<p style='color:#6b7280'>No agenda items added yet.</p>";

    html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#0a1040;padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:#f59e0b;font-size:18px;margin:0;font-weight:700">${assoc.name}</h1>
          <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:4px 0 0">Meeting Notice</p>
        </div>
        <div style="background:white;border:1px solid #e5e7eb;border-top:none;padding:28px;border-radius:0 0 12px 12px">
          <h2 style="font-size:22px;color:#0a1040;margin:0 0 16px">${meeting.title}</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr><td style="color:#6b7280;font-size:13px;padding:4px 0;width:100px">Date &amp; Time</td><td style="color:#111827;font-size:14px;font-weight:500">${dateStr}</td></tr>
            ${meeting.venue ? `<tr><td style="color:#6b7280;font-size:13px;padding:4px 0">Venue</td><td style="color:#111827;font-size:14px;font-weight:500">${meeting.venue}</td></tr>` : ""}
          </table>
          ${meeting.description ? `<p style="color:#374151;font-size:14px;line-height:1.6;margin-bottom:20px">${meeting.description}</p>` : ""}
          ${body.customMessage ? `<div style="background:#fef9c3;border:1px solid #fde047;padding:14px;border-radius:8px;margin-bottom:20px"><p style="color:#713f12;font-size:14px;margin:0">${body.customMessage}</p></div>` : ""}
          <h3 style="font-size:14px;font-weight:600;color:#0a1040;margin:0 0 10px">Agenda</h3>
          ${agendaHtml}
          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #f3f4f6;text-align:center">
            <a href="${domain}/meetings" style="display:inline-block;background:#0a1040;color:white;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none">View Meeting Details</a>
          </div>
        </div>
        <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px">You received this because you have a member portal account with ${assoc.name}.</p>
      </div>
    `;
  } else {
    // minutes_published
    subject = `Meeting Minutes Published: ${meeting.title}`;
    const resolvedItems = meeting.agendaItems.filter((a) => a.resolved && a.outcome);
    const resolutionsHtml = resolvedItems.length > 0
      ? `<h3 style="font-size:14px;font-weight:600;color:#0a1040;margin:20px 0 10px">Key Resolutions</h3><ul style="margin:0;padding-left:1.2em;color:#374151">${resolvedItems.map((a) => `<li style="margin-bottom:8px"><strong>${a.title}</strong><br><span style="color:#6b7280;font-size:13px">${a.outcome}</span></li>`).join("")}</ul>`
      : "";

    html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#0a1040;padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:#f59e0b;font-size:18px;margin:0;font-weight:700">${assoc.name}</h1>
          <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:4px 0 0">Meeting Minutes Published</p>
        </div>
        <div style="background:white;border:1px solid #e5e7eb;border-top:none;padding:28px;border-radius:0 0 12px 12px">
          <h2 style="font-size:22px;color:#0a1040;margin:0 0 8px">${meeting.title}</h2>
          <p style="color:#6b7280;font-size:13px;margin:0 0 20px">${dateStr}${meeting.venue ? ` · ${meeting.venue}` : ""}</p>
          ${body.customMessage ? `<div style="background:#fef9c3;border:1px solid #fde047;padding:14px;border-radius:8px;margin-bottom:20px"><p style="color:#713f12;font-size:14px;margin:0">${body.customMessage}</p></div>` : ""}
          ${resolutionsHtml}
          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #f3f4f6;text-align:center">
            <a href="${domain}/meetings" style="display:inline-block;background:#0a1040;color:white;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none">Read Full Minutes</a>
          </div>
        </div>
        <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px">You received this because you have a member portal account with ${assoc.name}.</p>
      </div>
    `;
  }

  // Send one email per account (not one batch email to all — that put every
  // recipient's address in everyone else's "To:" header) so failures can be
  // attributed and flagged per account instead of aborting the whole batch.
  let sent = 0;
  let failed = 0;
  for (const account of accounts) {
    try {
      await sendMail({ to: account.email, subject, html, fromName: assoc.name });
      sent++;
      await recordEmailResult((data) => prisma.memberAccount.update({ where: { id: account.id }, data }), null);
    } catch (err) {
      failed++;
      console.error("meeting notify send failed:", account.email, err);
      await recordEmailResult((data) => prisma.memberAccount.update({ where: { id: account.id }, data }), err);
    }
  }

  if (sent === 0) {
    return NextResponse.json({ success: false, error: "Failed to send notification email to any recipient" }, { status: 500 });
  }

  logActivity({
    associationId: ctx.associationId,
    adminId:   (ctx.session.user as { id?: string }).id ?? null,
    adminName: ctx.session.user?.name ?? null,
    action:    body.type === "meeting_notice" ? "meeting.notify_members" : "meeting.notify_minutes",
    entityType: "meeting",
    entityId:   meeting.id,
    entityName: meeting.title,
    meta:       { recipientCount: accounts.length, sent, failed, type: body.type },
  });

  return NextResponse.json({ success: true, data: { sent, failed } });
}
