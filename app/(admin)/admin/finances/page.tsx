import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import FinancesClient from "./FinancesClient";

export const dynamic = "force-dynamic";

export default async function FinancesPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");

  const associationId = ctx.associationId ?? undefined;

  const [years, accounts] = await Promise.all([
    prisma.financialYear.findMany({
      where:   { associationId },
      orderBy: { startDateAD: "desc" },
      include: { _count: { select: { journalEntries: true } } },
    }),
    prisma.financialAccount.findMany({
      where:   { associationId },
      orderBy: [{ order: "asc" }, { code: "asc" }],
      include: { _count: { select: { debitEntries: true, creditEntries: true } } },
    }),
  ]);

  // Load journal entries for the active (or most recent) year
  const activeYear = years.find((y) => y.status === "active") ?? years[0] ?? null;

  const entries = activeYear
    ? await prisma.journalEntry.findMany({
        where:   { associationId, financialYearId: activeYear.id },
        include: {
          debitAccount:  { select: { id: true, code: true, name: true, type: true } },
          creditAccount: { select: { id: true, code: true, name: true, type: true } },
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      })
    : [];

  // Serialize dates for client
  const serializedYears = years.map((y) => ({
    id:             y.id,
    label:          y.label,
    startDateAD:    y.startDateAD.toISOString(),
    endDateAD:      y.endDateAD.toISOString(),
    openingBalance: Number(y.openingBalance),
    status:         y.status,
    closedAt:       y.closedAt?.toISOString() ?? null,
    entryCount:     y._count.journalEntries,
  }));

  const serializedAccounts = accounts.map((a) => ({
    id:         a.id,
    code:       a.code,
    name:       a.name,
    type:       a.type,
    isDefault:  a.isDefault,
    order:      a.order,
    usageCount: a._count.debitEntries + a._count.creditEntries,
  }));

  const serializedEntries = entries.map((e) => ({
    id:            e.id,
    date:          e.date.toISOString(),
    description:   e.description,
    amount:        Number(e.amount),
    reference:     e.reference,
    entityType:    e.entityType,
    entityId:      e.entityId,
    debitAccount:  e.debitAccount,
    creditAccount: e.creditAccount,
    createdAt:     e.createdAt.toISOString(),
  }));

  return (
    <FinancesClient
      years={serializedYears}
      accounts={serializedAccounts}
      initialEntries={serializedEntries}
      initialYearId={activeYear?.id ?? null}
    />
  );
}
