import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { sendMail } from "@/lib/mailer";
import { recordEmailResult } from "@/lib/emailFailureTracking";

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { customMessage?: string };
  const customMessage = body.customMessage?.trim() ?? "";

  const aId = ctx.associationId;

  // Fetch association name + domain for email context
  const association = await prisma.association.findUnique({
    where: { id: aId },
    select: { name: true, domain: true },
  });
  if (!association) return NextResponse.json({ error: "Association not found" }, { status: 404 });

  // Get all pending/partial dues with member email
  const pendingDues = await prisma.duesPayment.findMany({
    where: {
      associationId: aId,
      status: { in: ["pending", "partial"] },
    },
    include: {
      member:         { select: { id: true, name: true, email: true } },
      memberCategory: { select: { name: true } },
    },
  });

  // Group by member (skip members without email)
  const memberMap = new Map<string, {
    memberId: string; name: string; email: string;
    dues: { type: string; period: string; amount: number; dueAmount: number | null; status: string }[];
  }>();

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  for (const d of pendingDues) {
    if (!d.member.email) continue;
    const key = d.member.email;
    const existing = memberMap.get(key) ?? { memberId: d.member.id, name: d.member.name, email: d.member.email, dues: [] };
    const start = new Date(d.periodStart);
    const period = d.type === "annual_renewal"
      ? String(start.getFullYear())
      : `${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
    existing.dues.push({
      type:      d.type === "monthly" ? "Monthly" : "Annual",
      period,
      amount:    Number(d.amount),
      dueAmount: d.dueAmount ? Number(d.dueAmount) : null,
      status:    d.status,
    });
    memberMap.set(key, existing);
  }

  if (memberMap.size === 0) {
    return NextResponse.json({ success: true, sent: 0, message: "No members with email and pending dues found." });
  }

  const baseUrl = `https://${association.domain}`;
  let sent = 0;
  const errors: string[] = [];

  for (const [, member] of memberMap) {
    const duesRows = member.dues.map((d) => {
      const outstanding = d.dueAmount && d.status === "partial"
        ? d.dueAmount - d.amount
        : d.dueAmount ?? d.amount;
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${d.type} — ${d.period}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:#dc2626;">
          Rs ${outstanding.toLocaleString()}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">
          <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:${d.status === "partial" ? "#fff7ed" : "#fef9c3"};color:${d.status === "partial" ? "#c2410c" : "#a16207"};">
            ${d.status === "partial" ? "Partially Paid" : "Pending"}
          </span>
        </td>
      </tr>`;
    }).join("");

    const totalOutstanding = member.dues.reduce((sum, d) => {
      const o = d.dueAmount && d.status === "partial" ? d.dueAmount - d.amount : d.dueAmount ?? d.amount;
      return sum + o;
    }, 0);

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Dues Reminder — ${association.name}</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.08);overflow:hidden;">
    <div style="background:#0a1040;padding:24px 32px;">
      <p style="margin:0;font-size:22px;font-weight:700;color:#f59e0b;">${association.name}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#ffffff80;">Membership Dues Reminder</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 12px;font-size:15px;color:#374151;">Dear <strong>${member.name}</strong>,</p>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">
        This is a friendly reminder that you have outstanding membership dues with ${association.name}.
        Please settle the balance at your earliest convenience.
      </p>
      ${customMessage ? `<div style="margin:0 0 20px;padding:12px 16px;background:#fefce8;border-left:3px solid #f59e0b;border-radius:4px;">
        <p style="margin:0;font-size:13px;color:#92400e;">${customMessage}</p>
      </div>` : ""}
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#374151;margin-bottom:16px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;font-weight:600;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">Period</th>
            <th style="padding:8px 12px;text-align:right;font-weight:600;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">Outstanding</th>
            <th style="padding:8px 12px;text-align:left;font-weight:600;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">Status</th>
          </tr>
        </thead>
        <tbody>${duesRows}</tbody>
        <tfoot>
          <tr style="background:#f9fafb;">
            <td style="padding:10px 12px;font-weight:700;color:#111827;">Total Outstanding</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700;color:#dc2626;font-size:16px;">Rs ${totalOutstanding.toLocaleString()}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <p style="margin:0 0 24px;font-size:13px;color:#6b7280;">
        Please contact us at your earliest convenience to arrange payment. You can also view your payment history in the member portal.
      </p>
      <a href="${baseUrl}/portal" style="display:inline-block;background:#0a1040;color:#f59e0b;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
        View Member Portal →
      </a>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        This reminder was sent by ${association.name}. If you believe this is an error, please contact us directly.
      </p>
    </div>
  </div>
</body></html>`;

    try {
      await sendMail({
        to:       member.email,
        subject:  `Dues Reminder — ${association.name}`,
        html,
        fromName: association.name,
      });
      sent++;
      await recordEmailResult((data) => prisma.member.update({ where: { id: member.memberId }, data }), null);
    } catch (err) {
      errors.push(`${member.email}: ${err instanceof Error ? err.message : "unknown error"}`);
      await recordEmailResult((data) => prisma.member.update({ where: { id: member.memberId }, data }), err);
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    skipped: memberMap.size - sent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
