"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, TrendingUp, TrendingDown, DollarSign, Plus, Save, X, Check,
  Loader2, ChevronDown, Calendar, Pencil, Trash2, FileText, Settings,
  ArrowUpRight, ArrowDownRight, Wallet,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import PanelCard from "@/components/ui/panel/PanelCard";
import { PanelTable, PanelTableHead, PanelTableRow } from "@/components/ui/panel/PanelTable";
import Badge from "@/components/ui/panel/Badge";
import EmptyState from "@/components/ui/panel/EmptyState";
import ConfirmDialog from "@/components/ui/panel/ConfirmDialog";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FinancialYear {
  id: string; label: string; startDateAD: string; endDateAD: string;
  openingBalance: number; status: string; closedAt: string | null; entryCount: number;
}

interface FinancialAccount {
  id: string; code: string; name: string; type: string; isDefault: boolean;
  order: number; usageCount: number;
}

interface AccountRef { id: string; code: string; name: string; type: string }

interface JournalEntry {
  id: string; date: string; description: string; amount: number;
  reference: string | null; entityType: string | null; entityId: string | null;
  debitAccount: AccountRef; creditAccount: AccountRef; createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  asset:     "bg-blue-50 text-blue-700",
  income:    "bg-green-50 text-green-700",
  expense:   "bg-red-50 text-red-700",
  liability: "bg-purple-50 text-purple-700",
};

const ENTITY_LABELS: Record<string, string> = {
  dues: "Dues", expense: "Expense", contribution: "Contribution",
  ticket: "Ticket", manual: "Manual",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function isIncomeEntry(entry: JournalEntry): boolean {
  // Credit account is income type → money coming IN
  return entry.creditAccount.type === "income";
}

function computeRunningBalance(entries: JournalEntry[], openingBalance: number) {
  let balance = openingBalance;
  return entries.map((e) => {
    if (isIncomeEntry(e)) balance += e.amount;
    else                   balance -= e.amount;
    return balance;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FinancesClient({
  years: initialYears,
  accounts: initialAccounts,
  initialEntries,
  initialYearId,
}: {
  years:          FinancialYear[];
  accounts:       FinancialAccount[];
  initialEntries: JournalEntry[];
  initialYearId:  string | null;
}) {
  const [years,    setYears]    = useState(initialYears);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [entries,  setEntries]  = useState(initialEntries);
  const [yearId,   setYearId]   = useState(initialYearId);
  const [activeTab, setActiveTab] = useState<"ledger" | "summary" | "years" | "accounts">("ledger");

  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New year form
  const [showNewYear,  setShowNewYear]  = useState(false);
  const [nyLabel,      setNyLabel]      = useState("");
  const [nyStart,      setNyStart]      = useState(`${new Date().getFullYear()}-01-01`);
  const [nyEnd,        setNyEnd]        = useState(`${new Date().getFullYear()}-12-31`);
  const [nyOpening,    setNyOpening]    = useState("0");
  const [savingYear,   setSavingYear]   = useState(false);

  // Manual journal entry form
  const [showNewEntry,  setShowNewEntry]  = useState(false);
  const [neDate,        setNeDate]        = useState(new Date().toISOString().slice(0, 10));
  const [neDesc,        setNeDesc]        = useState("");
  const [neDebitId,     setNeDebitId]     = useState("");
  const [neCreditId,    setNeCreditId]    = useState("");
  const [neAmount,      setNeAmount]      = useState("");
  const [neReference,   setNeReference]   = useState("");
  const [savingEntry,   setSavingEntry]   = useState(false);

  // Close year confirm
  const [confirmCloseYearId, setConfirmCloseYearId] = useState<string | null>(null);
  const [closingYear,        setClosingYear]         = useState(false);

  // Delete entry confirm
  const [confirmDeleteEntryId, setConfirmDeleteEntryId] = useState<string | null>(null);
  const [deletingEntry,        setDeletingEntry]         = useState(false);

  // Account form
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [acCode,         setAcCode]         = useState("");
  const [acName,         setAcName]         = useState("");
  const [acType,         setAcType]         = useState("expense");
  const [savingAccount,  setSavingAccount]  = useState(false);

  function showMsg(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const activeYear = years.find((y) => y.id === yearId) ?? null;

  const loadEntries = useCallback(async (forYearId: string) => {
    const res = await fetch(`/api/finances/journal?yearId=${forYearId}`);
    const j   = await res.json() as { success: boolean; data: JournalEntry[] };
    if (j.success) setEntries(j.data);
  }, []);

  async function switchYear(id: string) {
    setYearId(id);
    await loadEntries(id);
  }

  // ── Running balance & summary ─────────────────────────────────────────────
  const openingBalance = activeYear?.openingBalance ?? 0;
  const balances       = computeRunningBalance(entries, openingBalance);
  const totalIncome    = entries.filter(isIncomeEntry).reduce((s, e) => s + e.amount, 0);
  const totalExpense   = entries.filter((e) => !isIncomeEntry(e)).reduce((s, e) => s + e.amount, 0);
  const netBalance     = openingBalance + totalIncome - totalExpense;

  // ── Year management ────────────────────────────────────────────────────────

  async function createYear(e: React.FormEvent) {
    e.preventDefault();
    setSavingYear(true); setError(null);
    try {
      const res = await fetch("/api/finances/years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: nyLabel, startDateAD: nyStart, endDateAD: nyEnd, openingBalance: parseFloat(nyOpening) || 0 }),
      });
      const j = await res.json() as { success: boolean; data: FinancialYear & { _count?: unknown }; error?: string };
      if (!j.success) throw new Error(j.error);
      setYears((prev) => [{ ...j.data, entryCount: 0 }, ...prev]);
      setNyLabel(""); setNyOpening("0");
      setShowNewYear(false);
      showMsg("Financial year created.");
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSavingYear(false); }
  }

  async function closeYear(id: string) {
    setClosingYear(true);
    const res = await fetch(`/api/finances/years/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    const j = await res.json() as { success: boolean };
    setClosingYear(false);
    setConfirmCloseYearId(null);
    if (j.success) {
      setYears((prev) => prev.map((y) => y.id === id ? { ...y, status: "closed", closedAt: new Date().toISOString() } : y));
      showMsg("Year closed.");
    }
  }

  // ── Journal entry creation ─────────────────────────────────────────────────

  async function createEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!yearId) return;
    setSavingEntry(true); setError(null);
    try {
      const res = await fetch("/api/finances/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          financialYearId: yearId,
          date:            neDate,
          description:     neDesc,
          debitAccountId:  neDebitId,
          creditAccountId: neCreditId,
          amount:          parseFloat(neAmount),
          reference:       neReference || undefined,
        }),
      });
      const j = await res.json() as { success: boolean; data: JournalEntry; error?: string };
      if (!j.success) throw new Error(j.error);
      setEntries((prev) => [...prev, j.data].sort((a, b) => a.date.localeCompare(b.date)));
      setNeDesc(""); setNeAmount(""); setNeReference(""); setNeDebitId(""); setNeCreditId("");
      setShowNewEntry(false);
      showMsg("Journal entry added.");
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSavingEntry(false); }
  }

  // ── Delete entry ───────────────────────────────────────────────────────────

  async function deleteEntry(id: string) {
    setDeletingEntry(true);
    await fetch(`/api/finances/journal/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setConfirmDeleteEntryId(null);
    setDeletingEntry(false);
    showMsg("Entry deleted.");
  }

  // ── Account creation ───────────────────────────────────────────────────────

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setSavingAccount(true); setError(null);
    try {
      const res = await fetch("/api/finances/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: acCode, name: acName, type: acType }),
      });
      const j = await res.json() as { success: boolean; data: FinancialAccount; error?: string };
      if (!j.success) throw new Error(j.error);
      setAccounts((prev) => [...prev, { ...j.data, usageCount: 0 }].sort((a, b) => a.order - b.order));
      setAcCode(""); setAcName(""); setAcType("expense");
      setShowNewAccount(false);
      showMsg("Account created.");
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSavingAccount(false); }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-xl shadow-lg">
            <Check size={15} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <BookOpen size={22} className="text-emerald-500" /> Finances
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Ledger, income, expenses, and chart of accounts.</p>
        </div>

        {/* Year selector */}
        {years.length > 0 && (
          <div className="relative">
            <select
              value={yearId ?? ""}
              onChange={(e) => switchYear(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none appearance-none bg-white"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label} {y.status === "closed" ? "(closed)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* No year warning */}
      {years.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 mb-6 flex items-center gap-3">
          <Calendar size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">No financial year set up yet. Create one in the <strong>Years</strong> tab to start recording transactions.</p>
        </div>
      )}

      {/* Summary stats */}
      {activeYear && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <PanelCard className="p-4" hover={false}>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
              <Wallet size={11} /> Opening Balance
            </div>
            <div className="text-lg font-bold text-gray-700">Rs {openingBalance.toLocaleString()}</div>
          </PanelCard>
          <PanelCard className="p-4" hover={false}>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
              <ArrowUpRight size={11} className="text-green-500" /> Total Income
            </div>
            <div className="text-lg font-bold text-green-600">Rs {totalIncome.toLocaleString()}</div>
          </PanelCard>
          <PanelCard className="p-4" hover={false}>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
              <ArrowDownRight size={11} className="text-red-500" /> Total Expenses
            </div>
            <div className="text-lg font-bold text-red-600">Rs {totalExpense.toLocaleString()}</div>
          </PanelCard>
          <PanelCard className="p-4" hover={false}>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
              <DollarSign size={11} className={netBalance >= 0 ? "text-green-500" : "text-red-500"} /> Net Balance
            </div>
            <div className={`text-lg font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
              Rs {netBalance.toLocaleString()}
            </div>
          </PanelCard>
        </div>
      )}

      {error && <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{error}</p>}

      {/* Tabs */}
      <div className="overflow-x-auto -mx-1 px-1 mb-4">
        <div className="flex gap-1 border-b border-gray-100 min-w-max">
          {([
            { key: "ledger",   label: "Ledger",   icon: <FileText size={13} />,    count: entries.length },
            { key: "summary",  label: "Summary",  icon: <TrendingUp size={13} />,  count: null },
            { key: "years",    label: "Years",    icon: <Calendar size={13} />,    count: years.length },
            { key: "accounts", label: "Accounts", icon: <Settings size={13} />,    count: accounts.length },
          ] as const).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === tab.key ? "border-[#0a1040] text-[#0a1040]" : "border-transparent text-gray-400 hover:text-gray-700"}`}>
              {tab.icon} {tab.label}
              {tab.count !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${activeTab === tab.key ? "bg-[#0a1040] text-white" : "bg-gray-100 text-gray-500"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── LEDGER TAB ── */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          {/* Add entry button */}
          {activeYear?.status === "active" && (
            <div className="flex justify-end">
              <button onClick={() => setShowNewEntry((v) => !v)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-xl hover:bg-[#0d1550] transition-colors">
                <Plus size={14} /> Manual Entry
              </button>
            </div>
          )}

          {/* New entry form */}
          <AnimatePresence>
            {showNewEntry && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <form onSubmit={createEntry} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-emerald-900 flex items-center gap-1.5"><FileText size={14} /> Add Manual Journal Entry</h3>
                    <button type="button" onClick={() => setShowNewEntry(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Date <span className="text-red-400">*</span></label>
                      <input type="date" value={neDate} onChange={(e) => setNeDate(e.target.value)} required
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Amount (Rs) <span className="text-red-400">*</span></label>
                      <input type="number" min="1" step="1" value={neAmount} onChange={(e) => setNeAmount(e.target.value)} required placeholder="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Description <span className="text-red-400">*</span></label>
                      <input type="text" value={neDesc} onChange={(e) => setNeDesc(e.target.value)} required placeholder="What is this transaction?"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Debit Account (money flows INTO) <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <select value={neDebitId} onChange={(e) => setNeDebitId(e.target.value)} required
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none bg-white">
                          <option value="">Select account…</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Credit Account (money flows FROM) <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <select value={neCreditId} onChange={(e) => setNeCreditId(e.target.value)} required
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none bg-white">
                          <option value="">Select account…</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Reference / Voucher No.</label>
                      <input type="text" value={neReference} onChange={(e) => setNeReference(e.target.value)} placeholder="Optional"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
                    </div>
                  </div>
                  <button type="submit" disabled={savingEntry}
                    className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm rounded-xl hover:bg-[#0d1550] disabled:opacity-50 transition-colors">
                    <Plus size={13} />{savingEntry ? "Adding…" : "Add Entry"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ledger table */}
          {entries.length === 0 ? (
            <PanelCard className="py-14" hover={false}>
              <EmptyState
                icon={FileText}
                title="No transactions recorded yet."
                description={activeYear?.status === "active" ? "Transactions are auto-recorded when dues are paid, expenses are added, or tickets are sold." : undefined}
              />
            </PanelCard>
          ) : (
            <PanelTable>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {entries.map((e, i) => {
                  const isIn = isIncomeEntry(e);
                  return (
                    <div key={e.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {isIn
                              ? <ArrowUpRight size={13} className="text-green-500 flex-shrink-0" />
                              : <ArrowDownRight size={13} className="text-red-500 flex-shrink-0" />}
                            <span className="text-sm font-medium text-gray-900 truncate">{e.description}</span>
                          </div>
                          <div className="text-xs text-gray-400 ml-5">{formatDate(e.date)}</div>
                          {e.reference && <div className="text-xs text-gray-400 ml-5">Ref: {e.reference}</div>}
                          <div className="text-xs text-gray-300 ml-5 mt-0.5">
                            Dr: {e.debitAccount.name} · Cr: {e.creditAccount.name}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-sm font-bold ${isIn ? "text-green-600" : "text-red-600"}`}>
                            {isIn ? "+" : "-"}Rs {e.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">Bal: Rs {balances[i].toLocaleString()}</div>
                          {e.entityType === "manual" && (
                            <button onClick={() => setConfirmDeleteEntryId(e.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors mt-1"><Trash2 size={13} /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Mobile total row */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Closing Balance</span>
                  <span className={`text-sm font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    Rs {netBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Desktop table */}
              <table className="hidden md:table w-full text-sm">
                <PanelTableHead>
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-green-600">In</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-red-600">Out</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Balance</th>
                    <th className="px-4 py-3" />
                  </tr>
                </PanelTableHead>
                <tbody className="divide-y divide-gray-50">
                  {/* Opening balance row */}
                  <tr className="bg-gray-50/50">
                    <td className="px-4 py-2 text-xs text-gray-400">{formatDate(activeYear?.startDateAD ?? "")}</td>
                    <td className="px-4 py-2 text-xs text-gray-400 italic" colSpan={4}>Opening balance</td>
                    <td className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Rs {openingBalance.toLocaleString()}</td>
                    <td />
                  </tr>
                  {entries.map((e, i) => {
                    const isIn = isIncomeEntry(e);
                    const bal  = balances[i];
                    return (
                      <PanelTableRow key={e.id} index={i}>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(e.date)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 text-sm">{e.description}</div>
                          {e.reference && <div className="text-xs text-gray-400">Ref: {e.reference}</div>}
                          {e.entityType && e.entityType !== "manual" && (
                            <span className="text-xs text-gray-300">Auto · {ENTITY_LABELS[e.entityType] ?? e.entityType}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-500">{isIn ? e.creditAccount.name : e.debitAccount.name}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isIn && <span className="text-sm font-semibold text-green-600">Rs {e.amount.toLocaleString()}</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isIn && <span className="text-sm font-semibold text-red-600">Rs {e.amount.toLocaleString()}</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-semibold ${bal >= 0 ? "text-gray-700" : "text-red-600"}`}>
                            Rs {bal.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {e.entityType === "manual" && (
                            <button onClick={() => setConfirmDeleteEntryId(e.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                          )}
                        </td>
                      </PanelTableRow>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-100">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Closing Balance</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">Rs {totalIncome.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">Rs {totalExpense.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-bold text-lg ${netBalance >= 0 ? "text-gray-900" : "text-red-600"}`}>
                      Rs {netBalance.toLocaleString()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </PanelTable>
          )}

          <ConfirmDialog
            open={confirmDeleteEntryId !== null}
            title="Delete this journal entry?"
            message={confirmDeleteEntryId ? entries.find((e) => e.id === confirmDeleteEntryId)?.description : undefined}
            loading={deletingEntry}
            onConfirm={() => confirmDeleteEntryId && deleteEntry(confirmDeleteEntryId)}
            onCancel={() => setConfirmDeleteEntryId(null)}
          />
        </div>
      )}

      {/* ── SUMMARY TAB ── */}
      {activeTab === "summary" && (
        <div className="space-y-4">
          {/* By account type */}
          {(["income", "expense"] as const).map((type) => {
            const isIncome = type === "income";
            const relevant = entries.filter((e) =>
              isIncome ? isIncomeEntry(e) : !isIncomeEntry(e)
            );
            // Group by account name
            const byAccount: Record<string, { name: string; total: number }> = {};
            relevant.forEach((e) => {
              const acct = isIncome ? e.creditAccount : e.debitAccount;
              if (!byAccount[acct.id]) byAccount[acct.id] = { name: acct.name, total: 0 };
              byAccount[acct.id].total += e.amount;
            });
            const rows = Object.values(byAccount).sort((a, b) => b.total - a.total);
            const total = rows.reduce((s, r) => s + r.total, 0);
            if (rows.length === 0 && relevant.length === 0) return null;

            return (
              <PanelCard key={type} className="overflow-hidden" hover={false}>
                <div className={`px-5 py-3 border-b border-gray-100 flex items-center gap-2 ${isIncome ? "bg-green-50/50" : "bg-red-50/50"}`}>
                  {isIncome
                    ? <TrendingUp size={14} className="text-green-600" />
                    : <TrendingDown size={14} className="text-red-600" />}
                  <span className={`text-sm font-semibold ${isIncome ? "text-green-800" : "text-red-800"}`}>
                    {isIncome ? "Income" : "Expenses"} — Rs {total.toLocaleString()}
                  </span>
                </div>
                {rows.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No {type} transactions recorded.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {rows.map((r) => (
                      <div key={r.name} className="flex items-center justify-between px-5 py-3">
                        <span className="text-sm text-gray-700">{r.name}</span>
                        <span className={`text-sm font-semibold ${isIncome ? "text-green-600" : "text-red-600"}`}>
                          Rs {r.total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </PanelCard>
            );
          })}

          {entries.length === 0 && (
            <PanelCard className="py-14" hover={false}>
              <EmptyState icon={TrendingUp} title="No transactions to summarise yet." />
            </PanelCard>
          )}
        </div>
      )}

      {/* ── YEARS TAB ── */}
      {activeTab === "years" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowNewYear((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-xl hover:bg-[#0d1550] transition-colors">
              <Plus size={14} /> New Financial Year
            </button>
          </div>

          <AnimatePresence>
            {showNewYear && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <form onSubmit={createYear} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-indigo-900 flex items-center gap-1.5"><Calendar size={14} /> Create Financial Year</h3>
                    <button type="button" onClick={() => setShowNewYear(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Year Label <span className="text-red-400">*</span></label>
                      <input type="text" value={nyLabel} onChange={(e) => setNyLabel(e.target.value)} required placeholder="e.g. FY 2026 or FY 2081-82"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Start Date <span className="text-red-400">*</span></label>
                      <input type="date" value={nyStart} onChange={(e) => setNyStart(e.target.value)} required
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">End Date <span className="text-red-400">*</span></label>
                      <input type="date" value={nyEnd} onChange={(e) => setNyEnd(e.target.value)} required
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Opening Balance (Rs)</label>
                      <input type="number" min="0" step="1" value={nyOpening} onChange={(e) => setNyOpening(e.target.value)} placeholder="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
                      <p className="text-xs text-gray-400 mt-1">Set to 0 for a fresh year, or carry over the closing balance from the previous year.</p>
                    </div>
                  </div>
                  <button type="submit" disabled={savingYear}
                    className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm rounded-xl hover:bg-[#0d1550] disabled:opacity-50 transition-colors">
                    <Save size={13} />{savingYear ? "Creating…" : "Create Year"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {years.length === 0 ? (
            <PanelCard className="py-14" hover={false}>
              <EmptyState icon={Calendar} title="No financial years yet. Create one above." />
            </PanelCard>
          ) : (
            <PanelTable>
              <div className="divide-y divide-gray-50">
                {years.map((y) => (
                  <div key={y.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-gray-900 text-sm">{y.label}</span>
                        <Badge tone={y.status === "active" ? "success" : "neutral"}>
                          {y.status === "active" ? "Active" : "Closed"}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(y.startDateAD)} — {formatDate(y.endDateAD)} · Opening: Rs {y.openingBalance.toLocaleString()} · {y.entryCount} entries
                      </div>
                      {y.closedAt && <div className="text-xs text-gray-300">Closed {formatDate(y.closedAt)}</div>}
                    </div>
                    {y.status === "active" && (
                      confirmCloseYearId === y.id ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-red-600 font-medium">Close this year?</span>
                          <button onClick={() => closeYear(y.id)} disabled={closingYear}
                            className="text-xs font-semibold text-white bg-red-500 px-2 py-1 rounded hover:bg-red-600 transition-colors">
                            {closingYear ? "Closing…" : "Yes, close"}
                          </button>
                          <button onClick={() => setConfirmCloseYearId(null)} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmCloseYearId(y.id)}
                          className="flex-shrink-0 flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
                          <Pencil size={11} /> Close Year
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
            </PanelTable>
          )}
        </div>
      )}

      {/* ── ACCOUNTS TAB ── */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowNewAccount((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-xl hover:bg-[#0d1550] transition-colors">
              <Plus size={14} /> Add Account
            </button>
          </div>

          <AnimatePresence>
            {showNewAccount && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <form onSubmit={createAccount} className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-1.5"><Settings size={14} /> Add Account</h3>
                    <button type="button" onClick={() => setShowNewAccount(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Code <span className="text-red-400">*</span></label>
                      <input type="text" value={acCode} onChange={(e) => setAcCode(e.target.value)} required placeholder="e.g. 5005"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Name <span className="text-red-400">*</span></label>
                      <input type="text" value={acName} onChange={(e) => setAcName(e.target.value)} required placeholder="e.g. Office Rent"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Type <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <select value={acType} onChange={(e) => setAcType(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none bg-white">
                          {["asset", "income", "expense", "liability"].map((t) => (
                            <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                          ))}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={savingAccount}
                    className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm rounded-xl hover:bg-[#0d1550] disabled:opacity-50 transition-colors">
                    <Plus size={13} />{savingAccount ? "Adding…" : "Add Account"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Group accounts by type */}
          {(["asset", "income", "expense", "liability"] as const).map((type) => {
            const typeAccounts = accounts.filter((a) => a.type === type);
            if (typeAccounts.length === 0) return null;
            return (
              <PanelCard key={type} className="overflow-hidden" hover={false}>
                <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ACCOUNT_TYPE_COLORS[type]}`}>{type}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {typeAccounts.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-xs font-mono text-gray-400 w-12 flex-shrink-0">{a.code}</span>
                      <span className="flex-1 text-sm text-gray-800">{a.name}</span>
                      {a.isDefault && (
                        <span className="text-xs text-gray-300">Default</span>
                      )}
                      <span className="text-xs text-gray-400">{a.usageCount} entries</span>
                    </div>
                  ))}
                </div>
              </PanelCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
