import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payments = await prisma.duesPayment.findMany({
    where: { associationId: ctx.associationId },
    orderBy: [{ periodStart: "desc" }],
    include: {
      member:         { select: { name: true, area: true } },
      memberCategory: { select: { name: true } },
    },
  });

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function periodLabel(type: string, start: Date) {
    if (type === "annual_renewal") return String(start.getFullYear());
    return `${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
  }

  const header = [
    "Member", "Area", "Category", "Type", "Period", "Due Amount (Rs)",
    "Paid Amount (Rs)", "Method", "Status", "Receipt #", "Paid On", "Notes",
  ];

  const rows = payments.map((p) => {
    const start   = new Date(p.periodStart);
    const dueAmt  = p.dueAmount ? Number(p.dueAmount) : "";
    const paidAmt = Number(p.amount);
    return [
      p.member.name,
      p.member.area,
      p.memberCategory?.name ?? "",
      p.type === "monthly" ? "Monthly" : "Annual",
      periodLabel(p.type, start),
      dueAmt,
      paidAmt,
      p.method,
      p.status,
      p.receiptNumber ?? "",
      p.paidAt ? new Date(p.paidAt).toISOString().slice(0, 10) : "",
      (p.notes ?? "").replace(/\n/g, " "),
    ];
  });

  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const date     = new Date().toISOString().slice(0, 10);
  const filename = `dues-export-${date}.csv`;

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
