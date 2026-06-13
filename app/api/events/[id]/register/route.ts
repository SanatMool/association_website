import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAssociation } from "@/lib/getAssociation";
import { sendMail } from "@/lib/mailer";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json() as {
    ticketTypeId: string; buyerName: string; buyerEmail: string;
    buyerPhone: string; quantity?: number; notes?: string;
  };

  if (!body.ticketTypeId || !body.buyerName || !body.buyerEmail || !body.buyerPhone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const association = await getAssociation();
  const event = await prisma.event.findFirst({
    where: { id: params.id, associationId: association?.id ?? undefined },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const ticketType = await prisma.ticketType.findFirst({
    where: { id: body.ticketTypeId, eventId: params.id, active: true },
  });
  if (!ticketType) return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });

  const qty = Math.max(1, body.quantity ?? 1);

  // Atomic capacity check + create + soldCount increment to prevent race conditions
  let registration: Awaited<ReturnType<typeof prisma.ticketRegistration.create>>;
  try {
    registration = await prisma.$transaction(async (tx) => {
      // Re-fetch inside transaction for up-to-date soldCount
      const fresh = await tx.ticketType.findUnique({ where: { id: body.ticketTypeId } });
      if (!fresh || !fresh.active) throw new Error("TICKET_NOT_FOUND");

      if (fresh.strictCapacity && fresh.totalCapacity !== null) {
        if (fresh.soldCount + qty > fresh.totalCapacity) throw new Error("SOLD_OUT");
      }

      const reg = await tx.ticketRegistration.create({
        data: {
          ticketTypeId:  body.ticketTypeId,
          eventId:       params.id,
          associationId: association?.id ?? "",
          buyerName:     body.buyerName.trim(),
          buyerEmail:    body.buyerEmail.trim().toLowerCase(),
          buyerPhone:    body.buyerPhone.trim(),
          notes:         body.notes?.trim() || null,
          quantity:      qty,
          amount:        Number(fresh.price) * qty,
        },
      });

      await tx.ticketType.update({
        where: { id: body.ticketTypeId },
        data:  { soldCount: { increment: qty } },
      });

      return reg;
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "SOLD_OUT") return NextResponse.json({ error: "Sorry, this ticket type is sold out." }, { status: 409 });
    if (msg === "TICKET_NOT_FOUND") return NextResponse.json({ error: "Ticket type not found." }, { status: 404 });
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }

  // Notify admins (fire-and-forget)
  if (association?.id) {
    notifyAdminsNewReg(association.id, association.name, event.title, registration, ticketType.name).catch(console.error);
  }
  // Confirm to buyer (fire-and-forget)
  confirmBuyer(body.buyerEmail, body.buyerName, event.title, ticketType.name, qty, association?.name ?? "").catch(console.error);

  return NextResponse.json({ success: true, data: { id: registration.id, checkInToken: registration.checkInToken } }, { status: 201 });
}

async function notifyAdminsNewReg(
  associationId: string, associationName: string, eventTitle: string,
  reg: { buyerName: string; buyerEmail: string; buyerPhone: string; quantity: number },
  ticketTypeName: string,
) {
  const assocRecord = await prisma.association.findUnique({ where: { id: associationId }, select: { domain: true } });
  const baseUrl = assocRecord?.domain ? `https://${assocRecord.domain}` : "";

  const setting = await prisma.siteSettings.findUnique({
    where: { key_associationId: { key: "admin_notification_email", associationId } },
  });
  let recipients: string[] = [];
  if (setting?.value) { recipients = [setting.value]; }
  else {
    const admins = await prisma.adminUser.findMany({ where: { associationId }, select: { email: true } });
    recipients = admins.map((a) => a.email);
  }
  if (recipients.length === 0) return;

  await sendMail({
    to: recipients,
    subject: `New ticket registration — ${eventTitle}`,
    fromName: associationName,
    html: `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px;">
      <div style="background:#0a1040;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <h2 style="color:#f59e0b;margin:0;font-size:16px;">New Ticket Registration</h2>
        <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:12px;">${eventTitle}</p>
      </div>
      <div style="background:white;border-radius:8px;padding:20px;border:1px solid #e2e8f0;font-size:13px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#64748b;width:110px;">Name</td><td style="color:#1e293b;font-weight:600;">${reg.buyerName}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">Email</td><td style="color:#1e293b;">${reg.buyerEmail}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">Phone</td><td style="color:#1e293b;">${reg.buyerPhone}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">Ticket</td><td style="color:#1e293b;">${ticketTypeName} × ${reg.quantity}</td></tr>
        </table>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #f1f5f9;">
          <a href="${baseUrl}/admin/events" style="display:inline-block;background:#0a1040;color:white;padding:8px 16px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:600;">View Registrations →</a>
        </div>
      </div>
    </div>`,
  });
}

async function confirmBuyer(email: string, name: string, eventTitle: string, ticketType: string, qty: number, associationName: string) {
  await sendMail({
    to: email,
    subject: `Interest registered — ${eventTitle}`,
    fromName: associationName,
    html: `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px;">
      <div style="background:#0a1040;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <h2 style="color:#f59e0b;margin:0;font-size:16px;">Registration Received</h2>
        <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:12px;">${eventTitle}</p>
      </div>
      <div style="background:white;border-radius:8px;padding:20px;border:1px solid #e2e8f0;font-size:14px;color:#475569;">
        <p style="margin:0 0 12px;">Dear <strong style="color:#1e293b;">${name}</strong>,</p>
        <p style="margin:0 0 12px;">We have received your registration for <strong style="color:#1e293b;">${eventTitle}</strong>.</p>
        <div style="background:#f8fafc;border-radius:8px;padding:14px;border:1px solid #e2e8f0;margin-bottom:16px;">
          <p style="margin:0 0 6px;color:#64748b;font-size:12px;text-transform:uppercase;font-weight:600;">Registration Details</p>
          <p style="margin:0;color:#1e293b;"><strong>${ticketType}</strong> × ${qty}</p>
        </div>
        <p style="margin:0;color:#94a3b8;font-size:12px;">Our team will confirm your registration and contact you with payment details shortly.</p>
      </div>
      <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px;">${associationName}</p>
    </div>`,
  });
}
