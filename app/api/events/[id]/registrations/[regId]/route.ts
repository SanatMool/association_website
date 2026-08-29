import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { sendMail } from "@/lib/mailer";
import QRCode from "qrcode";
import { journalForTicket } from "@/lib/autoJournal";
import { recordEmailResult } from "@/lib/emailFailureTracking";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; regId: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reg = await prisma.ticketRegistration.findFirst({
    where: { id: params.regId, eventId: params.id, associationId: ctx.associationId },
    include: { event: { select: { title: true } }, ticketType: { select: { name: true } } },
  });
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    action: "confirm_payment" | "cancel" | "refund";
    paymentMethod?: string; receiptNumber?: string; amount?: number;
    cancelReason?: string; refundAmount?: number;
  };

  const adminName = ctx.session.user?.name ?? "Admin";
  let updated;

  if (body.action === "confirm_payment") {
    if (reg.paymentStatus === "paid") return NextResponse.json({ error: "Already paid" }, { status: 400 });
    updated = await prisma.ticketRegistration.update({
      where: { id: params.regId },
      data: {
        paymentStatus:    "paid",
        paymentMethod:    body.paymentMethod ?? null,
        receiptNumber:    body.receiptNumber ?? null,
        amount:           body.amount ?? Number(reg.amount) ?? null,
        paidAt:           new Date(),
        recordedByAdminId: (ctx.session.user as { id?: string }).id ?? null,
      },
    });

    // Send QR email
    const flagRegEmail = (err: unknown) =>
      recordEmailResult((data) => prisma.ticketRegistration.update({ where: { id: params.regId }, data }), err);
    sendPaymentConfirmEmail(reg, ctx.associationId)
      .then(() => flagRegEmail(null))
      .catch((err) => { console.error(err); flagRegEmail(err); });

    // Auto-journal
    journalForTicket({
      associationId:  ctx.associationId,
      registrationId: params.regId,
      description:    `Ticket sale — ${reg.event.title} (${reg.buyerName})`,
      amount:         body.amount ?? Number(reg.amount) ?? 0,
      method:         body.paymentMethod,
      receiptNumber:  body.receiptNumber,
      date:           new Date(),
      adminId:        (ctx.session.user as { id?: string }).id ?? null,
    });

  } else if (body.action === "cancel") {
    if (reg.paymentStatus === "cancelled") return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
    updated = await prisma.ticketRegistration.update({
      where: { id: params.regId },
      data: {
        paymentStatus: "cancelled",
        cancelledAt:   new Date(),
        cancelReason:  body.cancelReason ?? null,
      },
    });
    // Decrement soldCount
    await prisma.ticketType.update({
      where: { id: reg.ticketTypeId },
      data:  { soldCount: { decrement: reg.quantity } },
    });

  } else if (body.action === "refund") {
    if (reg.paymentStatus !== "paid") return NextResponse.json({ error: "Can only refund paid registrations" }, { status: 400 });
    updated = await prisma.ticketRegistration.update({
      where: { id: params.regId },
      data: {
        paymentStatus: "refunded",
        refundedAt:    new Date(),
        refundAmount:  body.refundAmount ?? Number(reg.amount) ?? null,
      },
    });
    await prisma.ticketType.update({
      where: { id: reg.ticketTypeId },
      data:  { soldCount: { decrement: reg.quantity } },
    });

  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  void adminName; // used by future audit log
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; regId: string } }) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reg = await prisma.ticketRegistration.findFirst({
    where: { id: params.regId, eventId: params.id, associationId: ctx.associationId },
  });
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (reg.paymentStatus === "paid") {
    return NextResponse.json({ error: "Cannot delete a paid registration. Cancel or refund first." }, { status: 400 });
  }

  await prisma.ticketRegistration.delete({ where: { id: params.regId } });
  if (reg.paymentStatus === "pending") {
    await prisma.ticketType.update({ where: { id: reg.ticketTypeId }, data: { soldCount: { decrement: reg.quantity } } });
  }
  return NextResponse.json({ success: true });
}

async function sendPaymentConfirmEmail(
  reg: { buyerEmail: string; buyerName: string; checkInToken: string; quantity: number; event: { title: string }; ticketType: { name: string } },
  associationId: string,
) {
  const assoc = await prisma.association.findUnique({ where: { id: associationId }, select: { name: true, domain: true } });
  const assocName = assoc?.name ?? "EVA Nepal";
  const baseUrl = assoc?.domain ? `https://${assoc.domain}` : "";
  const checkInUrl = `${baseUrl}/admin/checkin/${reg.checkInToken}`;
  const qrDataUrl = await QRCode.toDataURL(checkInUrl, { width: 200, margin: 1 });

  await sendMail({
    to: reg.buyerEmail,
    subject: `Payment confirmed — ${reg.event.title}`,
    fromName: assocName,
    html: `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px;">
      <div style="background:#0a1040;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <h2 style="color:#f59e0b;margin:0;font-size:16px;">Payment Confirmed ✓</h2>
        <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:12px;">${reg.event.title}</p>
      </div>
      <div style="background:white;border-radius:8px;padding:20px;border:1px solid #e2e8f0;font-size:14px;color:#475569;">
        <p style="margin:0 0 12px;">Dear <strong style="color:#1e293b;">${reg.buyerName}</strong>,</p>
        <p style="margin:0 0 16px;">Your payment has been confirmed. Please show the QR code below at the event entrance for check-in.</p>
        <div style="background:#f8fafc;border-radius:8px;padding:14px;border:1px solid #e2e8f0;margin-bottom:20px;text-align:center;">
          <img src="${qrDataUrl}" alt="Check-in QR code" style="width:160px;height:160px;" />
          <p style="margin:8px 0 0;color:#64748b;font-size:11px;">Scan at the event entrance</p>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:14px;border:1px solid #e2e8f0;">
          <p style="margin:0 0 6px;color:#64748b;font-size:12px;text-transform:uppercase;font-weight:600;">Your Ticket</p>
          <p style="margin:0;color:#1e293b;font-weight:600;">${reg.ticketType.name} × ${reg.quantity}</p>
        </div>
      </div>
      <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px;">${assocName}</p>
    </div>`,
  });
}
