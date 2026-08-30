import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { autoArchivePastEvents } from "@/lib/eventStatus";
import DashboardClient from "@/components/admin/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;
  await autoArchivePastEvents(associationId);

  const now     = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [memberCount, eventCount, newsCount, committeeCount, recentMembers, recentNews, recentEvents, settings, pendingTasks, overdueTasks, upcomingMeetings, pendingDuesCount, activityLogs, ledgerSummary] =
    await Promise.all([
      prisma.memberAssociation.count({ where: { associationId: associationId ?? undefined, visible: true } }),
      prisma.event.count({ where: { associationId: associationId ?? undefined } }),
      prisma.news.count({ where: { associationId: associationId ?? undefined } }),
      prisma.committeeMember.count({ where: { associationId: associationId ?? undefined, active: true } }),
      prisma.member.findMany({
        where: { associations: { some: { associationId: associationId ?? undefined, visible: true } } },
        take: 4,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, area: true, createdAt: true },
      }),
      prisma.news.findMany({
        where: { associationId },
        take: 3,
        orderBy: { publishedAt: "desc" },
        select: { id: true, title: true, publishedAt: true },
      }),
      prisma.event.findMany({
        where: { associationId },
        take: 3,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, date: true },
      }),
      prisma.siteSettings.findMany({
        where: { associationId },
        select: { key: true, value: true },
      }),
      prisma.adminTask.findMany({
        where: { status: { not: "done" }, associationId },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "asc" }],
        take: 6,
      }),
      prisma.adminTask.findMany({
        where: { status: { not: "done" }, dueDate: { lt: now }, associationId },
        select: { id: true, title: true, dueDate: true, priority: true },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.meeting.findMany({
        where: { associationId: associationId ?? undefined, status: "scheduled", scheduledAt: { gte: now, lte: in7days } },
        select: { id: true, title: true, scheduledAt: true, type: true },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
      prisma.duesPayment.count({ where: { associationId: associationId ?? undefined, status: "pending" } }),
      prisma.activityLog.findMany({
        where: { associationId: associationId ?? undefined },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      // Phase D — financial year net balance for dashboard stat
      (async () => {
        const activeYear = await prisma.financialYear.findFirst({
          where: { associationId: associationId ?? undefined, status: "active" },
          select: { id: true, label: true, openingBalance: true },
        });
        if (!activeYear) return null;
        const [incomeAgg, expenseAgg] = await Promise.all([
          prisma.journalEntry.findMany({
            where: { associationId: associationId ?? undefined, financialYearId: activeYear.id },
            select: { amount: true, creditAccount: { select: { type: true } } },
          }),
          prisma.journalEntry.findMany({
            where: { associationId: associationId ?? undefined, financialYearId: activeYear.id },
            select: { amount: true, debitAccount: { select: { type: true } } },
          }),
        ]);
        const totalIncome  = incomeAgg.filter((e) => e.creditAccount.type === "income").reduce((s, e) => s + Number(e.amount), 0);
        const totalExpense = expenseAgg.filter((e) => e.debitAccount.type === "expense").reduce((s, e) => s + Number(e.amount), 0);
        const netBalance   = Number(activeYear.openingBalance) + totalIncome - totalExpense;
        return { label: activeYear.label, totalIncome, totalExpense, netBalance };
      })(),
    ]);

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const memberMode = settingsMap["member_mode"] === "person" ? "person" : "venue";

  const checklist = [
    { label: "Set real phone number", done: !settingsMap["contact_phone"]?.includes("XXXXXXX"), href: "/admin/settings" },
    { label: "Set Facebook URL", done: settingsMap["social_facebook"] !== "https://facebook.com/evanepal", href: "/admin/settings" },
    { label: "Set Instagram URL", done: settingsMap["social_instagram"] !== "https://instagram.com/evanepal", href: "/admin/settings" },
    { label: memberMode === "person" ? "Add members" : "Add member venues", done: memberCount > 10, href: "/admin/members" },
    { label: "Add upcoming events", done: eventCount > 0, href: "/admin/events" },
    { label: "Publish news articles", done: newsCount > 0, href: "/admin/news" },
    { label: "Add committee members", done: committeeCount > 0, href: "/admin/committee" },
    { label: "Change default admin password", done: false, href: "/admin/users" },
  ];

  const completedCount = checklist.filter((c) => c.done).length;

  return (
    <DashboardClient
      memberCount={memberCount}
      eventCount={eventCount}
      newsCount={newsCount}
      committeeCount={committeeCount}
      recentMembers={recentMembers.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
      recentNews={recentNews.map((n) => ({ ...n, publishedAt: n.publishedAt.toISOString() }))}
      recentEvents={recentEvents.map((e) => ({ ...e, date: e.date.toISOString() }))}
      checklist={checklist}
      completedCount={completedCount}
      pendingTasks={pendingTasks.map((t) => ({ ...t, dueDate: t.dueDate?.toISOString() ?? null }))}
      overdueTasks={overdueTasks.map((t) => ({ ...t, dueDate: t.dueDate?.toISOString() ?? null }))}
      upcomingMeetings={upcomingMeetings.map((m) => ({ ...m, scheduledAt: m.scheduledAt.toISOString() }))}
      pendingDuesCount={pendingDuesCount}
      activityLogs={activityLogs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString(), meta: l.meta as Record<string, unknown> | null }))}
      ledgerSummary={ledgerSummary}
    />
  );
}
