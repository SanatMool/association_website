"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Clock, CheckCircle, XCircle, Eye, Trash2, AlertTriangle,
  ArrowRight, UserPlus, Lock, Search, X, RotateCcw,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
  ClipboardList, User, Phone, Mail, MapPin, Users, Globe, Building2,
  Banknote, Receipt, CreditCard, SkipForward, PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@/lib/utils";

function safeDate(val: string | null | undefined): string {
  if (!val) return "—";
  try { return formatDate(val); } catch { return "—"; }
}

interface Application {
  id: string;
  venueName: string;
  ownerName: string;
  phone: string;
  email: string;
  location: string;
  capacity: string | null;
  website: string | null;
  status: string;
  memberId: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pending",  color: "bg-amber-50 text-amber-700 border-amber-200" },
  reviewed: { label: "Reviewed", color: "bg-blue-50 text-blue-700 border-blue-200" },
  accepted: { label: "Accepted", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200" },
};

const STATUS_ICON: Record<string, React.ElementType> = {
  pending:  Clock,
  reviewed: Eye,
  accepted: CheckCircle,
  rejected: XCircle,
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected]         = useState<Application | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmAccept, setConfirmAccept]     = useState(false);
  const [confirmReject, setConfirmReject]     = useState(false);
  const [confirmReopen, setConfirmReopen]     = useState(false);
  const [working, setWorking]           = useState(false);
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);
  const [sortKey, setSortKey]           = useState<"venueName" | "ownerName" | "createdAt" | "status">("createdAt");
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage]   = useState(1);
  const PAGE_SIZE = 20;

  // ── Fee panel state ───────────────────────────────────────────────────────
  interface FeeCategory { id: string; name: string; monthlyFee: string; annualRenewalFee: string }
  const [feeMode, setFeeMode]           = useState<"prompt" | "form" | "done">("prompt");
  const [feePayStatus, setFeePayStatus] = useState<"paid" | "pending">("paid");
  const [feeDueType, setFeeDueType]     = useState<"monthly" | "annual">("annual");
  const [feeAmount, setFeeAmount]       = useState("");
  const [feeMethod, setFeeMethod]       = useState("cash");
  const [feeReceipt, setFeeReceipt]     = useState("");
  const [feePeriodStart, setFeePeriodStart] = useState("");
  const [feePeriodEnd, setFeePeriodEnd]     = useState("");
  const [feeCategoryId, setFeeCategoryId]   = useState("");
  const [feeCategories, setFeeCategories]   = useState<FeeCategory[]>([]);
  const [feeSaving, setFeeSaving]       = useState(false);

  const FEE_METHODS = [
    { value: "cash",         label: "Cash" },
    { value: "cheque",       label: "Cheque" },
    { value: "bank_transfer",label: "Bank Transfer" },
    { value: "online",       label: "Online / eSewa / Khalti" },
  ];

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  function clearConfirms() {
    setConfirmAccept(false);
    setConfirmReject(false);
    setConfirmReopen(false);
    setConfirmDeleteId(null);
  }

  useEffect(() => {
    fetch("/api/membership-applications")
      .then((r) => r.json())
      .then((data: Application[]) => { setApplications(data); setLoading(false); });
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  // Fetch fee categories once
  useEffect(() => {
    fetch("/api/membership/categories")
      .then((r) => r.json())
      .then((res) => { if (res.success) setFeeCategories(res.data ?? []); })
      .catch(() => {});
  }, []);

  // Reset fee panel when selected application changes
  useEffect(() => {
    setFeeMode("prompt");
    setFeePayStatus("paid");
    setFeeDueType("annual");
    setFeeAmount("");
    setFeeMethod("cash");
    setFeeReceipt("");
    setFeePeriodStart("");
    setFeePeriodEnd("");
    setFeeCategoryId("");
  }, [selected?.id]);

  function selectApp(app: Application) {
    if (selected?.id === app.id) { clearConfirms(); setSelected(null); return; }
    clearConfirms();
    setSelected(app);
  }

  async function markReviewed() {
    if (!selected || working) return;
    setWorking(true);
    const res  = await fetch(`/api/membership-applications/${selected.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "reviewed" }),
    });
    const json = await res.json() as { success: boolean; error?: string };
    setWorking(false);
    if (!json.success) { showToast(json.error ?? "Failed", false); return; }
    const updated = { ...selected, status: "reviewed" };
    setApplications((prev) => prev.map((a) => a.id === selected.id ? updated : a));
    setSelected(updated);
    showToast("Marked as reviewed.", true);
  }

  async function acceptApplication() {
    if (!selected || working) return;
    setWorking(true); setConfirmAccept(false);
    const res  = await fetch(`/api/membership-applications/${selected.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    });
    const json = await res.json() as { success: boolean; error?: string; memberId?: string };
    setWorking(false);
    if (!json.success) { showToast(json.error ?? "Failed to accept", false); return; }
    const updated = { ...selected, status: "accepted", memberId: json.memberId ?? null };
    setApplications((prev) => prev.map((a) => a.id === selected.id ? updated : a));
    setSelected(updated);
    showToast("Application accepted — member profile created!", true);
  }

  async function rejectApplication() {
    if (!selected || working) return;
    setWorking(true); setConfirmReject(false);
    const res  = await fetch(`/api/membership-applications/${selected.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    const json = await res.json() as { success: boolean; error?: string };
    setWorking(false);
    if (!json.success) { showToast(json.error ?? "Failed to reject", false); return; }
    const updated = { ...selected, status: "rejected" };
    setApplications((prev) => prev.map((a) => a.id === selected.id ? updated : a));
    setSelected(updated);
    showToast("Application rejected.", false);
  }

  async function reopenApplication() {
    if (!selected || working) return;
    setWorking(true); setConfirmReopen(false);
    const res  = await fetch(`/api/membership-applications/${selected.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending" }),
    });
    const json = await res.json() as { success: boolean; error?: string };
    setWorking(false);
    if (!json.success) { showToast(json.error ?? "Failed to reopen", false); return; }
    const updated = { ...selected, status: "pending" };
    setApplications((prev) => prev.map((a) => a.id === selected.id ? updated : a));
    setSelected(updated);
    showToast("Application reopened.", true);
  }

  async function deleteApplication(id: string) {
    setConfirmDeleteId(null);
    await fetch(`/api/membership-applications/${id}`, { method: "DELETE" });
    setApplications((prev) => prev.filter((a) => a.id !== id));
    if (selected?.id === id) setSelected(null);
    showToast("Application deleted.", false);
  }

  const counts = {
    pending:  applications.filter((a) => a.status === "pending").length,
    reviewed: applications.filter((a) => a.status === "reviewed").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return applications
      .filter((a) => {
        const matchesSearch = search === "" ||
          a.venueName.toLowerCase().includes(q) ||
          a.ownerName.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || a.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "venueName")      cmp = a.venueName.localeCompare(b.venueName);
        else if (sortKey === "ownerName") cmp = a.ownerName.localeCompare(b.ownerName);
        else if (sortKey === "status")    cmp = a.status.localeCompare(b.status);
        else                              cmp = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [applications, search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setCurrentPage(1);
  }

  async function saveFeePayment() {
    if (!selected?.memberId || feeSaving) return;
    if (!feeAmount || !feePeriodStart || !feePeriodEnd) {
      showToast("Please fill in amount and period.", false); return;
    }
    setFeeSaving(true);
    const res = await fetch("/api/membership/dues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId:        selected.memberId,
        memberCategoryId: feeCategoryId || undefined,
        type:            feeDueType,
        amount:          parseFloat(feeAmount),
        periodStart:     feePeriodStart,
        periodEnd:       feePeriodEnd,
        method:          feePayStatus === "paid" ? feeMethod : "pending",
        status:          feePayStatus,
        receiptNumber:   feeReceipt || undefined,
      }),
    });
    const json = await res.json() as { success: boolean; error?: string };
    setFeeSaving(false);
    if (!json.success) { showToast(json.error ?? "Failed to save payment", false); return; }
    showToast(feePayStatus === "paid" ? "Payment recorded!" : "Due created!", true);
    setFeeMode("done");
  }

  function SortIcon({ col }: { col: typeof sortKey }) {
    if (sortKey !== col) return <ChevronsUpDown size={11} className="text-gray-300 ml-0.5 inline" />;
    return sortDir === "asc"
      ? <ChevronUp   size={11} className="text-amber-500 ml-0.5 inline" />
      : <ChevronDown size={11} className="text-amber-500 ml-0.5 inline" />;
  }

  // ── Reusable pagination ────────────────────────────────────────────────────
  function renderPagination() {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <p className="text-xs text-gray-400">
          {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40">
            <ChevronLeft size={13} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
            .reduce<(number | "…")[]>((acc, p, idx, arr) => {
              if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
              acc.push(p); return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>
              ) : (
                <button key={p} onClick={() => setCurrentPage(p as number)}
                  className={`w-7 h-7 text-xs rounded-lg border transition-colors ${safePage === p ? "bg-[#0a1040] text-white border-[#0a1040]" : "border-gray-200 text-gray-600 hover:bg-white"}`}>
                  {p}
                </button>
              )
            )}
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40">
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    );
  }

  // ── Shared detail panel content ───────────────────────────────────────────
  function renderDetail() {
    if (!selected) return null;
    const StatusIcon = STATUS_ICON[selected.status] ?? Clock;
    const cfg = STATUS_CONFIG[selected.status] ?? STATUS_CONFIG.pending;

    const fields: { icon: React.ElementType; label: string; value: string }[] = [
      { icon: User,   label: "Owner",    value: selected.ownerName },
      { icon: Phone,  label: "Phone",    value: selected.phone },
      { icon: Mail,   label: "Email",    value: selected.email },
      { icon: MapPin, label: "Location", value: selected.location },
      { icon: Users,  label: "Capacity", value: selected.capacity ?? "—" },
      { icon: Globe,  label: "Website",  value: selected.website ?? "—" },
    ];

    return (
      <>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-base leading-tight">{selected.venueName}</h3>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Clock size={10} /> Applied {safeDate(selected.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${cfg.color}`}>
              <StatusIcon size={10} /> {cfg.label}
            </span>
            <button
              onClick={() => { clearConfirms(); setSelected(null); }}
              className="text-gray-300 hover:text-gray-500 transition-colors p-1 rounded-lg hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-3 mb-5">
          {fields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon size={13} className="text-gray-400" />
              </div>
              <div className="min-w-0 pt-0.5">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">{label}</div>
                <div className="text-sm text-gray-700 font-medium break-all">{value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2.5">

          {/* ── ACCEPTED ─── */}
          {selected.status === "accepted" && (
            <div className="space-y-3">
              {/* Member profile link */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
                  <CheckCircle size={13} /> Member profile created
                </div>
                {selected.memberId && (
                  <Link href={`/admin/members/${selected.memberId}`}
                    className="text-xs text-emerald-700 underline font-semibold hover:text-emerald-800 flex-shrink-0">
                    View profile →
                  </Link>
                )}
              </div>

              {/* ── Fee panel ── */}
              {feeMode === "prompt" && (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center gap-2 text-gray-700 font-semibold text-xs mb-2">
                    <Banknote size={13} /> Record membership fee?
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Add a payment record or due for this member, or skip if not needed.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setFeeMode("form")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-[#0a1040] rounded-lg hover:bg-[#0d1550] transition-colors">
                      <PlusCircle size={11} /> Add Payment / Due
                    </button>
                    <button onClick={() => setFeeMode("done")}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                      <SkipForward size={11} /> Skip
                    </button>
                  </div>
                </div>
              )}

              {feeMode === "done" && (
                <div className="border border-gray-100 rounded-xl p-3 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Fee step complete.</span>
                  <button onClick={() => setFeeMode("form")}
                    className="text-xs text-[#0a1040] underline font-medium">Add another</button>
                </div>
              )}

              {feeMode === "form" && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <CreditCard size={12} /> Fee Payment
                    </span>
                    <button onClick={() => setFeeMode("prompt")} className="text-gray-300 hover:text-gray-500">
                      <X size={13} />
                    </button>
                  </div>

                  {/* Mode toggle */}
                  <div className="flex gap-1.5">
                    {(["paid","pending"] as const).map((m) => (
                      <button key={m} onClick={() => setFeePayStatus(m)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                          feePayStatus === m
                            ? m === "paid" ? "bg-emerald-600 text-white border-emerald-600" : "bg-amber-500 text-white border-amber-500"
                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}>
                        {m === "paid" ? "✓ Record Payment" : "⏳ Create Due"}
                      </button>
                    ))}
                  </div>

                  {/* Category */}
                  {feeCategories.length > 0 && (
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Category (optional)</label>
                      <select value={feeCategoryId} onChange={(e) => {
                        setFeeCategoryId(e.target.value);
                        const cat = feeCategories.find((c) => c.id === e.target.value);
                        if (cat) setFeeAmount(feeDueType === "monthly" ? cat.monthlyFee : cat.annualRenewalFee);
                      }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0a1040]/30">
                        <option value="">No category</option>
                        {feeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Due type */}
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Due type</label>
                    <div className="flex gap-1.5">
                      {(["monthly","annual"] as const).map((t) => (
                        <button key={t} onClick={() => {
                          setFeeDueType(t);
                          const cat = feeCategories.find((c) => c.id === feeCategoryId);
                          if (cat) setFeeAmount(t === "monthly" ? cat.monthlyFee : cat.annualRenewalFee);
                        }}
                          className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                            feeDueType === t ? "bg-[#0a1040] text-white border-[#0a1040]" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}>
                          {t === "monthly" ? "Monthly" : "Annual"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Period */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Period start</label>
                      <select value={feePeriodStart} onChange={(e) => setFeePeriodStart(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0a1040]/30">
                        <option value="">Select</option>
                        {YEARS.flatMap((y) => MONTHS.map((m, mi) => {
                          const val = `${y}-${String(mi + 1).padStart(2,"0")}-01`;
                          return <option key={val} value={val}>{m} {y}</option>;
                        }))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Period end</label>
                      <select value={feePeriodEnd} onChange={(e) => setFeePeriodEnd(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0a1040]/30">
                        <option value="">Select</option>
                        {YEARS.flatMap((y) => MONTHS.map((m, mi) => {
                          const val = `${y}-${String(mi + 1).padStart(2,"0")}-28`;
                          return <option key={val} value={val}>{m} {y}</option>;
                        }))}
                      </select>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Amount (Rs)</label>
                    <input type="number" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0a1040]/30" />
                  </div>

                  {/* Method + receipt (paid only) */}
                  {feePayStatus === "paid" && (
                    <>
                      <div>
                        <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Payment method</label>
                        <select value={feeMethod} onChange={(e) => setFeeMethod(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0a1040]/30">
                          {FEE_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                          Receipt no. <span className="normal-case text-gray-300">(optional)</span>
                        </label>
                        <div className="relative">
                          <Receipt size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                          <input type="text" value={feeReceipt} onChange={(e) => setFeeReceipt(e.target.value)}
                            placeholder="e.g. REC-001"
                            className="w-full pl-8 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0a1040]/30" />
                        </div>
                      </div>
                    </>
                  )}

                  <button onClick={saveFeePayment} disabled={feeSaving}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-white bg-[#0a1040] rounded-lg hover:bg-[#0d1550] transition-colors disabled:opacity-50">
                    {feeSaving
                      ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : feePayStatus === "paid" ? <><CheckCircle size={12} /> Save Payment</> : <><PlusCircle size={12} /> Create Due</>
                    }
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── REJECTED ─── */}
          {selected.status === "rejected" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-1">
                <XCircle size={15} /> Application Rejected
              </div>
              <p className="text-xs text-red-500 mb-3">
                If this was a mistake, you can reopen it for review.
              </p>
              {confirmReopen ? (
                <div className="bg-white border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-gray-700 font-medium mb-2">
                    Reopen and set back to pending?
                  </p>
                  <div className="flex gap-2">
                    <button onClick={reopenApplication} disabled={working}
                      className="flex-1 py-2.5 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">
                      {working ? "Reopening…" : "Yes, Reopen"}
                    </button>
                    <button onClick={() => setConfirmReopen(false)}
                      className="px-3 py-2.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { clearConfirms(); setConfirmReopen(true); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
                  <RotateCcw size={12} /> Reopen Application
                </button>
              )}
            </div>
          )}

          {/* ── ACTIVE ACTIONS ─── */}
          {selected.status !== "accepted" && selected.status !== "rejected" && (
            <>
              <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                <Lock size={11} className="mt-0.5 flex-shrink-0" />
                Accepting or rejecting is permanent and cannot be undone.
              </div>

              {selected.status === "pending" && (
                <button onClick={markReviewed} disabled={working}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50">
                  <Eye size={12} /> Mark as Reviewed
                </button>
              )}

              {confirmAccept ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs mb-2">
                    <UserPlus size={12} /> Accept this application?
                  </div>
                  <ul className="text-xs text-emerald-700 space-y-1 mb-3 list-disc list-inside">
                    <li>Member profile created for <strong>{selected.venueName}</strong></li>
                    <li>Added to the member directory</li>
                    <li>You can complete their profile afterwards</li>
                  </ul>
                  <div className="flex gap-2">
                    <button onClick={acceptApplication} disabled={working}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                      {working ? "Creating…" : <><CheckCircle size={11} /> Yes, Accept &amp; Create Member</>}
                    </button>
                    <button onClick={() => setConfirmAccept(false)}
                      className="px-3 py-2.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { clearConfirms(); setConfirmAccept(true); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors">
                  <UserPlus size={12} /> Accept &amp; Create Member Profile
                  <ArrowRight size={12} />
                </button>
              )}

              {confirmReject ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs text-red-700 font-medium mb-2">
                    Reject this application? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={rejectApplication} disabled={working}
                      className="flex-1 py-2.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">
                      {working ? "Rejecting…" : "Yes, Reject"}
                    </button>
                    <button onClick={() => setConfirmReject(false)}
                      className="px-3 py-2.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { clearConfirms(); setConfirmReject(true); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  <XCircle size={12} /> Reject Application
                </button>
              )}
            </>
          )}

          {/* Delete */}
          {selected.status !== "accepted" && (
            <div className="pt-1 border-t border-gray-100">
              {confirmDeleteId === selected.id ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700 font-medium mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={11} /> Permanently delete this record?
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => deleteApplication(selected.id)}
                      className="flex-1 py-2.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600">
                      Yes, delete
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 py-2.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { clearConfirms(); setConfirmDeleteId(selected.id); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-gray-400 hover:text-red-500 border border-gray-100 rounded-lg hover:border-red-200 transition-colors">
                  <Trash2 size={12} /> Delete Application Record
                </button>
              )}
            </div>
          )}
        </div>
      </>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.ok ? "bg-green-600" : "bg-gray-700"}`}
          >
            {toast.ok ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header */}
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <ClipboardList size={22} className="text-indigo-500" />
          Membership Applications
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {applications.length} total · {counts.pending} pending review
        </p>
      </div>

      {/* Stats — tappable filter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {(["pending", "reviewed", "accepted", "rejected"] as const).map((s) => {
          const cfg  = STATUS_CONFIG[s];
          const Icon = STATUS_ICON[s];
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(active ? "all" : s)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all select-none active:scale-95 ${
                active
                  ? cfg.color + " border-current shadow-sm"
                  : "bg-white border-gray-100 hover:border-gray-200 " + cfg.color.split(" ")[1]
              }`}
            >
              <Icon size={18} />
              <span className="text-2xl font-bold leading-none">{counts[s]}</span>
              <span className="text-[11px] font-medium">{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search venue, owner, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20">
          <Clock size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No applications yet</p>
          <p className="text-gray-400 text-sm mt-1">Applications from the membership form will appear here</p>
        </div>
      ) : (
        <>
          {/* ── Desktop: table + sidebar ────────────────────────────────── */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-5">
            {/* Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
              {paginated.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">No applications match your search.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer select-none hover:text-gray-700"
                        onClick={() => toggleSort("venueName")}>
                        <span className="flex items-center gap-1"><Building2 size={12} /> Venue <SortIcon col="venueName" /></span>
                      </th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer select-none hover:text-gray-700"
                        onClick={() => toggleSort("ownerName")}>
                        <span className="flex items-center gap-1"><User size={12} /> Owner <SortIcon col="ownerName" /></span>
                      </th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer select-none hover:text-gray-700"
                        onClick={() => toggleSort("createdAt")}>
                        <span className="flex items-center gap-1"><Clock size={12} /> Applied <SortIcon col="createdAt" /></span>
                      </th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer select-none hover:text-gray-700"
                        onClick={() => toggleSort("status")}>
                        Status <SortIcon col="status" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map((app) => {
                      const cfg  = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                      const Icon = STATUS_ICON[app.status] ?? Clock;
                      return (
                        <tr key={app.id}
                          className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${selected?.id === app.id ? "bg-amber-50/40" : ""}`}
                          onClick={() => selectApp(app)}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{app.venueName}</div>
                            {app.memberId && (
                              <div className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                                <CheckCircle size={10} /> Member created
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{app.ownerName}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{safeDate(app.createdAt)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${cfg.color}`}>
                              <Icon size={10} /> {cfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {renderPagination()}
            </div>

            {/* Sidebar */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 h-fit sticky top-6">
              {selected ? renderDetail() : (
                <div className="text-center py-10">
                  <ClipboardList size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Select an application to review</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Mobile: card list ────────────────────────────────────────── */}
          <div className="lg:hidden bg-white rounded-xl border border-gray-100 overflow-hidden">
            {paginated.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">No applications match your search.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {paginated.map((app) => {
                  const cfg  = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                  const Icon = STATUS_ICON[app.status] ?? Clock;
                  return (
                    <button
                      key={app.id}
                      onClick={() => selectApp(app)}
                      className={`w-full text-left px-4 py-4 hover:bg-gray-50/60 active:bg-gray-100 transition-colors ${selected?.id === app.id ? "bg-amber-50/60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Building2 size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="font-semibold text-gray-900 text-sm truncate">{app.venueName}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><User size={10} />{app.ownerName}</span>
                            <span className="flex items-center gap-1"><MapPin size={10} /><span className="truncate max-w-[130px]">{app.location}</span></span>
                          </div>
                          <div className="text-[11px] text-gray-300 mt-1.5 flex items-center gap-1">
                            <Clock size={10} /> {safeDate(app.createdAt)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full border ${cfg.color}`}>
                            <Icon size={10} /> {cfg.label}
                          </span>
                          {app.memberId && (
                            <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                              <CheckCircle size={9} /> Member
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {renderPagination()}
          </div>

          {/* ── Mobile bottom sheet ──────────────────────────────────────── */}
          <AnimatePresence>
            {selected && (
              <>
                {/* Backdrop */}
                <motion.div
                  key="backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => { clearConfirms(); setSelected(null); }}
                  className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                />
                {/* Sheet */}
                <motion.div
                  key="sheet"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 350, damping: 32 }}
                  className="fixed inset-x-0 bottom-0 z-50 lg:hidden bg-white rounded-t-3xl shadow-2xl flex flex-col"
                  style={{ maxHeight: "82vh" }}
                >
                  {/* Drag handle */}
                  <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                  </div>
                  {/* Scrollable content */}
                  <div className="overflow-y-auto flex-1 px-5 pb-10">
                    {renderDetail()}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
