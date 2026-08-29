/**
 * autoJournal — fire-and-forget helper that creates a JournalEntry
 * from an existing financial event (dues payment, expense, contribution, ticket).
 *
 * Silently skips if:
 *  - no active FinancialYear exists for the association
 *  - either account code is not found
 *  - amount <= 0
 *
 * Call this AFTER the primary record is already saved (non-blocking).
 */
import { prisma } from "@/lib/prisma";

// Payment method → cash account code
// "transfer" and "cheque" go to bank; everything else to cash in hand
function cashAccountCode(method?: string | null): string {
  if (method === "transfer" || method === "cheque") return "1002"; // Bank Account
  return "1001"; // Cash in Hand
}

export interface AutoJournalParams {
  associationId:    string;
  date:             Date;
  description:      string;
  amount:           number;
  debitAccountCode: string;  // e.g. "1001"
  creditAccountCode: string; // e.g. "4001"
  reference?:       string | null;
  entityType:       "dues" | "expense" | "contribution" | "ticket" | "manual";
  entityId:         string;
  adminId?:         string | null;
}

export async function autoJournal(params: AutoJournalParams): Promise<void> {
  if (params.amount <= 0) return;

  try {
    // Find an active financial year that covers this date
    const year = await prisma.financialYear.findFirst({
      where: {
        associationId: params.associationId,
        status:        "active",
        startDateAD:   { lte: params.date },
        endDateAD:     { gte: params.date },
      },
    });
    if (!year) return; // No active year — skip silently

    // Fetch debit + credit accounts in one query
    const accounts = await prisma.financialAccount.findMany({
      where: {
        associationId: params.associationId,
        code: { in: [params.debitAccountCode, params.creditAccountCode] },
      },
      select: { id: true, code: true },
    });

    const debit  = accounts.find((a) => a.code === params.debitAccountCode);
    const credit = accounts.find((a) => a.code === params.creditAccountCode);
    if (!debit || !credit) return; // Accounts not seeded yet — skip

    await prisma.journalEntry.create({
      data: {
        associationId:    params.associationId,
        financialYearId:  year.id,
        date:             params.date,
        description:      params.description,
        debitAccountId:   debit.id,
        creditAccountId:  credit.id,
        amount:           params.amount,
        reference:        params.reference ?? null,
        entityType:       params.entityType,
        entityId:         params.entityId,
        createdByAdminId: params.adminId ?? null,
      },
    });
  } catch {
    // Never let journal errors break the primary operation
  }
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

export function journalForExpense(opts: {
  associationId: string;
  expenseId: string;
  description: string;
  amount: number;
  date: Date;
  adminId?: string | null;
}) {
  void autoJournal({
    associationId:     opts.associationId,
    date:              opts.date,
    description:       opts.description,
    amount:            opts.amount,
    debitAccountCode:  "5001", // Meeting & Event Expenses
    creditAccountCode: "1001", // Cash in Hand (expenses paid from cash)
    entityType:        "expense",
    entityId:          opts.expenseId,
    adminId:           opts.adminId,
  });
}

export function journalForDues(opts: {
  associationId: string;
  duesId: string;
  description: string;
  amount: number;
  method?: string | null;
  receiptNumber?: string | null;
  date: Date;
  adminId?: string | null;
}) {
  void autoJournal({
    associationId:     opts.associationId,
    date:              opts.date,
    description:       opts.description,
    amount:            opts.amount,
    debitAccountCode:  cashAccountCode(opts.method),
    creditAccountCode: "4001", // Membership Dues Income
    reference:         opts.receiptNumber,
    entityType:        "dues",
    entityId:          opts.duesId,
    adminId:           opts.adminId,
  });
}

export function journalForContribution(opts: {
  associationId: string;
  contributionId: string;
  description: string;
  amount: number;
  method?: string | null;
  date: Date;
  adminId?: string | null;
}) {
  void autoJournal({
    associationId:     opts.associationId,
    date:              opts.date,
    description:       opts.description,
    amount:            opts.amount,
    debitAccountCode:  cashAccountCode(opts.method),
    creditAccountCode: "4003", // Donations & Contributions
    entityType:        "contribution",
    entityId:          opts.contributionId,
    adminId:           opts.adminId,
  });
}

export function journalForTicket(opts: {
  associationId: string;
  registrationId: string;
  description: string;
  amount: number;
  method?: string | null;
  receiptNumber?: string | null;
  date: Date;
  adminId?: string | null;
}) {
  void autoJournal({
    associationId:     opts.associationId,
    date:              opts.date,
    description:       opts.description,
    amount:            opts.amount,
    debitAccountCode:  cashAccountCode(opts.method),
    creditAccountCode: "4002", // Event / Ticket Income
    reference:         opts.receiptNumber,
    entityType:        "ticket",
    entityId:          opts.registrationId,
    adminId:           opts.adminId,
  });
}
