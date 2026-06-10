import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const aId = ctx.associationId;

  const [
    duesPayments,
    expenses,
    contributions,
    meetings,
    events,
    memberLinks,
    portalAccounts,
  ] = await Promise.all([
    prisma.duesPayment.findMany({
      where: { associationId: aId },
      select: { amount: true, status: true, type: true, periodStart: true, memberCategoryId: true, memberCategory: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      where: { associationId: aId },
      select: { amount: true, meetingId: true, meeting: { select: { title: true, scheduledAt: true } } },
    }),
    prisma.memberContribution.findMany({
      where: { associationId: aId },
      select: { amount: true, status: true, member: { select: { name: true } } },
    }),
    prisma.meeting.findMany({
      where: { associationId: aId },
      select: { id: true, title: true, scheduledAt: true, type: true, status: true, _count: { select: { rsvps: { where: { status: "attending" } } } } },
      orderBy: { scheduledAt: "desc" },
    }),
    prisma.event.findMany({
      where: { associationId: aId },
      select: { id: true, title: true, date: true, _count: { select: { rsvps: { where: { status: "attending" } } } } },
      orderBy: { date: "desc" },
      take: 20,
    }),
    prisma.memberAssociation.findMany({
      where: { associationId: aId },
      select: { joinedAt: true },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.memberAccount.count({ where: { associationId: aId } }),
  ]);

  // ── Dues aggregations ──────────────────────────────────────────────────────
  const paid    = duesPayments.filter((d) => d.status === "paid");
  const pending = duesPayments.filter((d) => d.status === "pending");
  const totalDuesPaid    = paid.reduce((s, d) => s + Number(d.amount), 0);
  const totalDuesPending = pending.reduce((s, d) => s + Number(d.amount), 0);

  // By month (use periodStart year-month as key)
  const duesMonthMap = new Map<string, { paid: number; pending: number }>();
  for (const d of duesPayments) {
    const dt = new Date(d.periodStart);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const cur = duesMonthMap.get(key) ?? { paid: 0, pending: 0 };
    if (d.status === "paid") cur.paid += Number(d.amount);
    else cur.pending += Number(d.amount);
    duesMonthMap.set(key, cur);
  }
  const duesByMonth = Array.from(duesMonthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));

  // By category
  const catMap = new Map<string, { paid: number; pending: number; count: number }>();
  for (const d of duesPayments) {
    const name = d.memberCategory?.name ?? "Uncategorised";
    const cur = catMap.get(name) ?? { paid: 0, pending: 0, count: 0 };
    cur.count++;
    if (d.status === "paid") cur.paid += Number(d.amount);
    else cur.pending += Number(d.amount);
    catMap.set(name, cur);
  }
  const duesByCategory = Array.from(catMap.entries())
    .sort(([, a], [, b]) => (b.paid + b.pending) - (a.paid + a.pending))
    .map(([name, v]) => ({ name, ...v }));

  // ── Expenses aggregations ──────────────────────────────────────────────────
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const expMtgMap = new Map<string, { title: string; scheduledAt: string; total: number }>();
  for (const e of expenses) {
    if (!e.meetingId || !e.meeting) continue;
    const cur = expMtgMap.get(e.meetingId) ?? { title: e.meeting.title, scheduledAt: e.meeting.scheduledAt.toISOString(), total: 0 };
    cur.total += Number(e.amount);
    expMtgMap.set(e.meetingId, cur);
  }
  const expensesByMeeting = Array.from(expMtgMap.values())
    .sort((a, b) => b.total - a.total);

  // ── Contributions aggregations ─────────────────────────────────────────────
  const paidContribs = contributions.filter((c) => c.status === "paid");
  const totalContributions = paidContribs.reduce((s, c) => s + Number(c.amount), 0);

  const contribMemberMap = new Map<string, number>();
  for (const c of paidContribs) {
    const name = c.member.name;
    contribMemberMap.set(name, (contribMemberMap.get(name) ?? 0) + Number(c.amount));
  }
  const contributionsByMember = Array.from(contribMemberMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, total]) => ({ name, total }));

  // ── Members by month ───────────────────────────────────────────────────────
  const memMonthMap = new Map<string, number>();
  for (const l of memberLinks) {
    const dt = new Date(l.joinedAt);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    memMonthMap.set(key, (memMonthMap.get(key) ?? 0) + 1);
  }
  const membersByMonth = Array.from(memMonthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  // ── Summary ────────────────────────────────────────────────────────────────
  const netBalance = totalDuesPaid + totalContributions - totalExpenses;

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        totalDuesPaid,
        totalDuesPending,
        totalExpenses,
        totalContributions,
        netBalance,
        totalMembers: memberLinks.length,
        activePortalAccounts: portalAccounts,
      },
      duesByMonth,
      duesByCategory,
      expensesByMeeting,
      contributionsByMember,
      meetingStats: meetings.map((m) => ({
        id: m.id, title: m.title, scheduledAt: m.scheduledAt.toISOString(),
        type: m.type, status: m.status, attending: m._count.rsvps,
      })),
      eventAttendance: events.map((e) => ({
        id: e.id, title: e.title, date: e.date.toISOString(), attending: e._count.rsvps,
      })),
      membersByMonth,
    },
  });
}
