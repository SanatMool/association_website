import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.associationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(ctx, "reports.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const aId = ctx.associationId;

  const yearParam = req.nextUrl.searchParams.get("year");
  const year      = yearParam ? parseInt(yearParam, 10) : null;
  const dateFrom  = year ? new Date(year,     0, 1) : undefined;
  const dateTo    = year ? new Date(year + 1, 0, 1) : undefined;
  const dateRange = dateFrom && dateTo ? { gte: dateFrom, lt: dateTo } : undefined;

  const [
    duesPayments,
    expenses,
    contributions,
    meetings,
    events,
    memberLinks,
    portalAccounts,
    allDuesDates,
    ticketRegistrations,
    journalEntries,
    activeYear,
  ] = await Promise.all([
    prisma.duesPayment.findMany({
      where: { associationId: aId, ...(dateRange ? { periodStart: dateRange } : {}) },
      select: { amount: true, dueAmount: true, status: true, type: true, periodStart: true, memberCategoryId: true, memberCategory: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      where: { associationId: aId, ...(dateRange ? { meeting: { scheduledAt: dateRange } } : {}) },
      select: { amount: true, meetingId: true, meeting: { select: { title: true, scheduledAt: true } } },
    }),
    prisma.memberContribution.findMany({
      where: { associationId: aId, ...(dateRange ? { meeting: { scheduledAt: dateRange } } : {}) },
      select: { amount: true, status: true, member: { select: { name: true } } },
    }),
    prisma.meeting.findMany({
      where: { associationId: aId, ...(dateRange ? { scheduledAt: dateRange } : {}) },
      select: { id: true, title: true, scheduledAt: true, type: true, status: true, _count: { select: { rsvps: { where: { status: "attending" } } } } },
      orderBy: { scheduledAt: "desc" },
    }),
    prisma.event.findMany({
      where: { associationId: aId, ...(dateRange ? { date: dateRange } : {}) },
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
    // fetch all periodStart dates to derive available years
    prisma.duesPayment.findMany({
      where: { associationId: aId },
      select: { periodStart: true },
    }),
    prisma.ticketRegistration.findMany({
      where: {
        associationId: aId,
        paymentStatus: "paid",
        ...(dateRange ? { createdAt: dateRange } : {}),
      },
      select: {
        amount: true,
        quantity: true,
        eventId: true,
        createdAt: true,
        event: { select: { title: true, date: true } },
      },
    }),
    // Phase D — journal entries for ledger tab
    prisma.journalEntry.findMany({
      where: {
        associationId: aId,
        ...(dateRange ? { date: dateRange } : {}),
      },
      select: {
        date:          true,
        amount:        true,
        entityType:    true,
        debitAccount:  { select: { name: true, type: true } },
        creditAccount: { select: { name: true, type: true } },
      },
      orderBy: { date: "asc" },
    }),
    // Active financial year
    prisma.financialYear.findFirst({
      where: { associationId: aId, status: "active" },
      select: { label: true, startDateAD: true, endDateAD: true, openingBalance: true },
    }),
  ]);

  // ── Dues aggregations ──────────────────────────────────────────────────────
  // For partial records: amount = collected so far, dueAmount = original bill
  // outstanding = dueAmount - amount (what's still owed)
  function outstandingAmount(d: { amount: unknown; dueAmount: unknown; status: string }) {
    if (d.status === "paid") return 0;
    if (d.status === "partial" && d.dueAmount) return Number(d.dueAmount) - Number(d.amount);
    // pending: dueAmount is the full bill if set, otherwise amount is the billed figure
    return d.dueAmount ? Number(d.dueAmount) : Number(d.amount);
  }

  const paid    = duesPayments.filter((d) => d.status === "paid");
  const totalDuesPaid    = paid.reduce((s, d) => s + Number(d.amount), 0);
  const totalDuesPending = duesPayments
    .filter((d) => d.status !== "paid")
    .reduce((s, d) => s + outstandingAmount(d), 0);

  // By month (use periodStart year-month as key)
  const duesMonthMap = new Map<string, { paid: number; pending: number }>();
  for (const d of duesPayments) {
    const dt = new Date(d.periodStart);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const cur = duesMonthMap.get(key) ?? { paid: 0, pending: 0 };
    if (d.status === "paid") cur.paid += Number(d.amount);
    else cur.pending += outstandingAmount(d);
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
    else cur.pending += outstandingAmount(d);
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

  // ── Ticket revenue aggregations ────────────────────────────────────────────
  const totalTicketRevenue = ticketRegistrations.reduce((s, r) => s + Number(r.amount ?? 0), 0);

  const ticketEventMap = new Map<string, { title: string; date: string; tickets: number; revenue: number }>();
  for (const r of ticketRegistrations) {
    const cur = ticketEventMap.get(r.eventId) ?? {
      title: r.event.title,
      date: r.event.date.toISOString(),
      tickets: 0,
      revenue: 0,
    };
    cur.tickets += r.quantity;
    cur.revenue += Number(r.amount ?? 0);
    ticketEventMap.set(r.eventId, cur);
  }
  const ticketsByEvent = Array.from(ticketEventMap.values()).sort((a, b) => b.revenue - a.revenue);

  // ── Journal / Ledger aggregations (Phase D) ───────────────────────────────
  // An entry is "income" when its creditAccount.type === "income"
  // An entry is "expense" when its debitAccount.type === "expense"
  const ledgerMonthMap = new Map<string, { income: number; expense: number }>();
  const incomeAccountMap  = new Map<string, number>();
  const expenseAccountMap = new Map<string, number>();
  let ledgerTotalIncome  = 0;
  let ledgerTotalExpense = 0;

  for (const je of journalEntries) {
    const amt = Number(je.amount);
    const dt  = new Date(je.date);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const cur = ledgerMonthMap.get(key) ?? { income: 0, expense: 0 };

    if (je.creditAccount.type === "income") {
      cur.income       += amt;
      ledgerTotalIncome += amt;
      incomeAccountMap.set(je.creditAccount.name, (incomeAccountMap.get(je.creditAccount.name) ?? 0) + amt);
    }
    if (je.debitAccount.type === "expense") {
      cur.expense        += amt;
      ledgerTotalExpense += amt;
      expenseAccountMap.set(je.debitAccount.name, (expenseAccountMap.get(je.debitAccount.name) ?? 0) + amt);
    }
    ledgerMonthMap.set(key, cur);
  }

  const ledgerByMonth = Array.from(ledgerMonthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));

  const ledgerByIncomeAccount  = Array.from(incomeAccountMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([name, total]) => ({ name, total }));
  const ledgerByExpenseAccount = Array.from(expenseAccountMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([name, total]) => ({ name, total }));

  const openingBalance  = activeYear ? Number(activeYear.openingBalance) : 0;
  const ledgerNetBalance = openingBalance + ledgerTotalIncome - ledgerTotalExpense;

  // ── Available years (for the year filter dropdown) ─────────────────────────
  const yearSet = new Set<number>();
  for (const d of allDuesDates)       yearSet.add(new Date(d.periodStart).getFullYear());
  for (const m of meetings)           yearSet.add(new Date(m.scheduledAt).getFullYear());
  for (const r of ticketRegistrations) yearSet.add(new Date(r.createdAt).getFullYear());
  for (const je of journalEntries)    yearSet.add(new Date(je.date).getFullYear());
  const availableYears = Array.from(yearSet).sort((a, b) => b - a);

  // ── Summary ────────────────────────────────────────────────────────────────
  const netBalance = totalDuesPaid + totalContributions + totalTicketRevenue - totalExpenses;

  return NextResponse.json({
    success: true,
    data: {
      year: year ?? null,
      availableYears,
      summary: {
        totalDuesPaid,
        totalDuesPending,
        totalExpenses,
        totalContributions,
        totalTicketRevenue,
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
      ticketsByEvent,
      ledger: {
        totalIncome:      ledgerTotalIncome,
        totalExpense:     ledgerTotalExpense,
        netBalance:       ledgerNetBalance,
        openingBalance,
        activeYear:       activeYear ? {
          label:       activeYear.label,
          startDateAD: activeYear.startDateAD.toISOString(),
          endDateAD:   activeYear.endDateAD.toISOString(),
        } : null,
        byMonth:          ledgerByMonth,
        byIncomeAccount:  ledgerByIncomeAccount,
        byExpenseAccount: ledgerByExpenseAccount,
        entryCount:       journalEntries.length,
      },
    },
  });
}
