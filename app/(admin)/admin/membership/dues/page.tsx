"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, CheckCircle, Clock, Trash2, ChevronDown, Search,
  User, CreditCard, FileText, ArrowRight, ArrowLeft,
  X, TrendingUp, AlertCircle, CalendarDays, Banknote,
  BadgeCheck, Receipt, Tag, Info, RefreshCw, PlusCircle, Pencil, Save,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member   { id: string; name: string; area: string; memberCategoryId?: string | null }
interface Category { id: string; name: string; monthlyFee: string; annualRenewalFee: string }
interface PaymentLine { method: string; amount: string }
interface BreakdownLine { method: string; amount: number }
interface Payment {
  id: string;
  type: string;
  amount: string;
  periodStart: string;
  periodEnd: string;
  method: string;
  status: string;
  receiptNumber: string | null;
  notes: string | null;
  paidAt: string | null;
  paymentBreakdown: BreakdownLine[] | null;
  member: { id: string; name: string; area: string };
  memberCategory: { id: string; name: string } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const currentYear = new Date().getFullYear();
const YEARS       = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

const STEPS = [
  { id: 1, label: "Select Member", icon: User,       hint: "Who is making this payment?" },
  { id: 2, label: "Payment Info",  icon: CreditCard, hint: "Type, period, and amount" },
  { id: 3, label: "Review & Save", icon: FileText,   hint: "Method, notes, and confirm" },
];

const PAYMENT_METHODS = [
  { value: "cash",     label: "Cash",          icon: "💵" },
  { value: "transfer", label: "Bank Transfer", icon: "🏦" },
  { value: "cheque",   label: "Cheque",        icon: "📄" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function periodDates(type: string, month: number, year: number) {
  if (type === "annual_renewal") {
    return { periodStart: `${year}-01-01`, periodEnd: `${year}-12-31` };
  }
  const lastDay = new Date(year, month, 0).getDate();
  const mm      = String(month).padStart(2, "0");
  return { periodStart: `${year}-${mm}-01`, periodEnd: `${year}-${mm}-${lastDay}` };
}

function periodLabel(p: Payment) {
  const d = new Date(p.periodStart);
  return p.type === "annual_renewal"
    ? `${d.getFullYear()}`
    : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 :  60, opacity: 0 }),
};

// ─── Sub-component: Step indicator ───────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = step > s.id;
        const active = step === s.id;
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-xs font-bold
                ${done   ? "bg-green-500 text-white shadow-sm"
                : active ? "bg-[#0a1040] text-white shadow-md ring-4 ring-indigo-100"
                :          "bg-gray-100 text-gray-400"}`}>
                {done ? <CheckCircle size={14} /> : <Icon size={14} />}
              </div>
              <span className={`text-[10px] mt-1 font-medium whitespace-nowrap ${active ? "text-[#0a1040]" : done ? "text-green-600" : "text-gray-400"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 rounded transition-colors duration-300 ${done ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DuesPage() {
  const [members,    setMembers]    = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [payments,   setPayments]   = useState<Payment[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);
  const [markingId,  setMarkingId]  = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [step, setStep]           = useState(1);
  const [dir,  setDir]            = useState(1);
  const [memberSearch, setMemberSearch] = useState("");

  const [fMemberId,   setFMemberId]   = useState("");
  const [fCategoryId, setFCategoryId] = useState("");
  const [fType,       setFType]       = useState("monthly");
  const [fMonth,      setFMonth]      = useState(new Date().getMonth() + 1);
  const [fYear,       setFYear]       = useState(currentYear);
  const [fAmount,     setFAmount]     = useState("");
  const [fBreakdown,  setFBreakdown]  = useState<PaymentLine[]>([{ method: "cash", amount: "" }]);
  const [fStatus,     setFStatus]     = useState("paid");
  const [fReceipt,    setFReceipt]    = useState("");
  const [fNotes,      setFNotes]      = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Edit state
  const [editId,     setEditId]     = useState<string | null>(null);
  const [editForm,   setEditForm]   = useState<{ status: string; method: string; receiptNumber: string; notes: string }>({ status: "", method: "", receiptNumber: "", notes: "" });
  const [editSaving, setEditSaving] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType,   setFilterType]   = useState("");
  const [filterMember, setFilterMember] = useState("");

  // ─── Data loading ────────────────────────────────────────────────────────────

  const loadPayments = useCallback(async () => {
    const p = new URLSearchParams();
    if (filterStatus) p.set("status",   filterStatus);
    if (filterType)   p.set("type",     filterType);
    if (filterMember) p.set("memberId", filterMember);
    const res  = await fetch(`/api/membership/dues?${p}`);
    const json = await res.json() as { success: boolean; data: Payment[] };
    if (json.success) setPayments(json.data);
  }, [filterStatus, filterType, filterMember]);

  const loadInit = useCallback(async () => {
    const [mRes, cRes] = await Promise.all([
      fetch("/api/members"),
      fetch("/api/membership/categories"),
    ]);
    const mJson = await mRes.json() as Member[];
    const cJson = await cRes.json() as { success: boolean; data: Category[] };
    setMembers(Array.isArray(mJson) ? mJson : []);
    if (cJson.success) setCategories(cJson.data);
    setLoading(false);
  }, []);

  useEffect(() => { void loadInit(); }, [loadInit]);
  useEffect(() => { if (!loading) void loadPayments(); }, [loading, loadPayments, filterStatus, filterType, filterMember]);

  // ─── Toast helper ─────────────────────────────────────────────────────────

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // ─── Form helpers ────────────────────────────────────────────────────────

  function autoFillAmount(catId: string, type: string) {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const amt = type === "annual_renewal" ? cat.annualRenewalFee : cat.monthlyFee;
    setFAmount(amt);
    setFBreakdown([{ method: "cash", amount: amt }]);
  }

  function onMemberSelect(memberId: string) {
    setFMemberId(memberId);
    setMemberSearch("");
    setFieldErrors((e) => ({ ...e, member: "" }));
    // Auto-select the member's default category and fill the amount
    const member = members.find((m) => m.id === memberId);
    if (member?.memberCategoryId) {
      setFCategoryId(member.memberCategoryId);
      autoFillAmount(member.memberCategoryId, fType);
    }
  }

  function onCategoryChange(catId: string) {
    setFCategoryId(catId);
    autoFillAmount(catId, fType);
  }

  function onTypeChange(type: string) {
    setFType(type);
    autoFillAmount(fCategoryId, type);
  }

  function resetForm() {
    setStep(1); setDir(1);
    setFMemberId(""); setFCategoryId(""); setFType("monthly");
    setFMonth(new Date().getMonth() + 1); setFYear(currentYear);
    setFAmount(""); setFBreakdown([{ method: "cash", amount: "" }]); setFStatus("paid");
    setFReceipt(""); setFNotes(""); setMemberSearch("");
    setFieldErrors({}); setError(null);
  }

  // ─── Breakdown helpers ────────────────────────────────────────────────────

  function updateBreakdownLine(i: number, field: keyof PaymentLine, value: string) {
    setFBreakdown((lines) => lines.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  }
  function addBreakdownLine() {
    setFBreakdown((lines) => [...lines, { method: "cash", amount: "" }]);
  }
  function removeBreakdownLine(i: number) {
    setFBreakdown((lines) => lines.length > 1 ? lines.filter((_, idx) => idx !== i) : lines);
  }
  const breakdownTotal = fBreakdown.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);

  // ─── Validation per step ─────────────────────────────────────────────────

  function validateStep(s: number): boolean {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!fMemberId) errs.member = "Please select a member before continuing.";
    }
    if (s === 2) {
      if (!fAmount || Number(fAmount) <= 0) errs.amount = "Enter a valid amount greater than 0.";
    }
    if (s === 3) {
      const total = fBreakdown.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
      if (total <= 0) errs.breakdown = "Add at least one payment line with an amount greater than 0.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setDir(1);
    setStep((s) => s + 1);
  }
  function goBack() { setDir(-1); setStep((s) => s - 1); }

  // ─── Submit ──────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!validateStep(3)) return;
    setSaving(true); setError(null);
    try {
      const { periodStart, periodEnd } = periodDates(fType, fMonth, fYear);
      const validLines = fBreakdown.filter((l) => parseFloat(l.amount) > 0);
      const body = {
        memberId:         fMemberId,
        memberCategoryId: fCategoryId || undefined,
        type:             fType,
        periodStart, periodEnd,
        status:           fStatus,
        receiptNumber:    fReceipt || undefined,
        notes:            fNotes   || undefined,
        paymentBreakdown: validLines.map((l) => ({ method: l.method, amount: parseFloat(l.amount) })),
      };
      const res  = await fetch("/api/membership/dues", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error ?? "Failed to save");
      setShowForm(false);
      resetForm();
      await loadPayments();
      showToast("Payment recorded successfully.", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setSaving(false); }
  }

  // ─── Mark paid ───────────────────────────────────────────────────────────

  async function markPaid(id: string) {
    setMarkingId(id);
    await fetch(`/api/membership/dues/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    await loadPayments();
    setMarkingId(null);
    showToast("Payment marked as paid.", true);
  }

  // ─── Edit ────────────────────────────────────────────────────────────────

  function openEdit(p: Payment) {
    setEditId(p.id);
    setEditForm({ status: p.status, method: p.method, receiptNumber: p.receiptNumber ?? "", notes: p.notes ?? "" });
    setConfirmDeleteId(null);
  }

  async function handleEditSave(id: string) {
    setEditSaving(true);
    await fetch(`/api/membership/dues/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status:        editForm.status,
        method:        editForm.method || undefined,
        receiptNumber: editForm.receiptNumber,
        notes:         editForm.notes,
      }),
    });
    setEditId(null);
    await loadPayments();
    setEditSaving(false);
    showToast("Payment updated.", true);
  }

  // ─── Delete ──────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/membership/dues/${id}`, { method: "DELETE" });
    await loadPayments();
    setDeletingId(null);
    setConfirmDeleteId(null);
    showToast("Payment record deleted.", false);
  }

  // ─── Computed ────────────────────────────────────────────────────────────

  const selectedMember   = members.find((m) => m.id === fMemberId);
  const selectedCategory = categories.find((c) => c.id === fCategoryId);
  const paidTotal        = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const pendingTotal     = payments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);

  const filteredMembers = members.filter((m) =>
    memberSearch === "" ||
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.area.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const { periodStart: previewPeriodStart } = periodDates(fType, fMonth, fYear);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
              ${toast.ok ? "bg-green-600 text-white" : "bg-gray-700 text-white"}`}
          >
            {toast.ok ? <CheckCircle size={15} /> : <Info size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Banknote size={22} className="text-indigo-500" /> Dues &amp; Payments
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Record and track membership fee payments for all members.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); resetForm(); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm rounded-xl hover:bg-[#0d1550] transition-colors shadow-sm w-full sm:w-auto min-h-[44px]"
        >
          <Plus size={14} /> Record Payment
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Records",     value: payments.length,                                       icon: FileText,    color: "text-gray-700",   bg: "bg-white",      border: "border-gray-100" },
          { label: "Paid",              value: payments.filter((p) => p.status === "paid").length,    icon: BadgeCheck,  color: "text-green-700",  bg: "bg-green-50",   border: "border-green-100" },
          { label: "Pending",           value: payments.filter((p) => p.status === "pending").length, icon: Clock,       color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-100" },
          { label: "Amount Collected",  value: `Rs ${paidTotal.toLocaleString()}`,                    icon: TrendingUp,  color: "text-indigo-700", bg: "bg-indigo-50",  border: "border-indigo-100" },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`${bg} rounded-xl border ${border} px-4 py-3 flex items-start gap-3`}>
            <div className={`mt-0.5 ${color} opacity-70`}><Icon size={16} /></div>
            <div>
              <div className={`text-lg font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending alert */}
      {pendingTotal > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-sm text-amber-800">
          <AlertCircle size={15} className="shrink-0" />
          <span><strong>Rs {pendingTotal.toLocaleString()}</strong> is pending collection from {payments.filter((p) => p.status === "pending").length} payment{payments.filter((p) => p.status === "pending").length > 1 ? "s" : ""}.</span>
        </div>
      )}

      {/* Guided form panel */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden"
          >
            {/* Form header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-0">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Record New Payment</h2>
                <p className="text-xs text-gray-400 mt-0.5">{STEPS[step - 1].hint}</p>
              </div>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 pt-4 pb-6">
              <StepBar step={step} />

              {/* Step content */}
              <div className="overflow-hidden" style={{ minHeight: 200 }}>
                <AnimatePresence mode="wait" custom={dir}>
                  <motion.div
                    key={step}
                    custom={dir}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                  >
                    {/* ── Step 1: Select Member ─────────────────────────────── */}
                    {step === 1 && (
                      <div className="space-y-4">
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                            <User size={12} /> Member <span className="text-red-400">*</span>
                          </label>
                          <p className="text-xs text-gray-400 mb-2">
                            Search and select the member who is making this dues payment.
                          </p>

                          {/* Search box */}
                          <div className="relative mb-3">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={memberSearch}
                              onChange={(e) => setMemberSearch(e.target.value)}
                              placeholder="Search by name or area…"
                              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                          </div>

                          {/* Member list */}
                          <div className="border border-gray-100 rounded-xl overflow-auto" style={{ maxHeight: 220 }}>
                            {filteredMembers.length === 0 ? (
                              <div className="text-center py-8 text-gray-400 text-xs">No members match your search.</div>
                            ) : (
                              filteredMembers.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => onMemberSelect(m.id)}
                                  className={`w-full text-left px-4 py-2.5 border-b border-gray-50 last:border-0 flex items-center justify-between transition-colors
                                    ${fMemberId === m.id ? "bg-indigo-50 border-l-2 border-l-indigo-500" : "hover:bg-gray-50"}`}
                                >
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{m.name}</div>
                                    <div className="text-xs text-gray-400">{m.area}</div>
                                  </div>
                                  {fMemberId === m.id && <CheckCircle size={14} className="text-indigo-500 shrink-0" />}
                                </button>
                              ))
                            )}
                          </div>

                          {fieldErrors.member && (
                            <p className="flex items-center gap-1 text-red-600 text-xs mt-2">
                              <AlertCircle size={11} /> {fieldErrors.member}
                            </p>
                          )}
                        </div>

                        {/* Selected member card */}
                        {selectedMember && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {selectedMember.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-indigo-900">{selectedMember.name}</div>
                              <div className="text-xs text-indigo-600">{selectedMember.area}</div>
                              {selectedMember.memberCategoryId && (
                                <div className="text-xs text-indigo-400 mt-0.5">
                                  Category auto-selected · amount pre-filled
                                </div>
                              )}
                            </div>
                            <BadgeCheck size={16} className="ml-auto text-indigo-400 shrink-0" />
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* ── Step 2: Payment Details ───────────────────────────── */}
                    {step === 2 && (
                      <div className="space-y-5">
                        {/* Payment type */}
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                            <CreditCard size={12} /> Payment Type <span className="text-red-400">*</span>
                          </label>
                          <p className="text-xs text-gray-400 mb-2">
                            Monthly dues are collected each month. Annual renewal covers the full calendar year.
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { v: "monthly",         l: "Monthly Dues",    sub: "One month period" },
                              { v: "annual_renewal",  l: "Annual Renewal",  sub: "Full calendar year" },
                            ].map(({ v, l, sub }) => (
                              <button key={v} type="button" onClick={() => onTypeChange(v)}
                                className={`text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium
                                  ${fType === v ? "border-[#0a1040] bg-[#0a1040]/5 text-[#0a1040]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                                {l}
                                <div className={`text-xs font-normal mt-0.5 ${fType === v ? "text-indigo-500" : "text-gray-400"}`}>{sub}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Period */}
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                            <CalendarDays size={12} /> Period <span className="text-red-400">*</span>
                          </label>
                          <p className="text-xs text-gray-400 mb-2">
                            {fType === "monthly"
                              ? "Select the month and year this payment covers."
                              : "Select the year this annual renewal covers (Jan 1 – Dec 31)."}
                          </p>
                          <div className="flex gap-2">
                            {fType === "monthly" && (
                              <div className="relative flex-1">
                                <select value={fMonth} onChange={(e) => setFMonth(Number(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none">
                                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                </select>
                                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                              </div>
                            )}
                            <div className="relative flex-1">
                              <select value={fYear} onChange={(e) => setFYear(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none">
                                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                              </select>
                              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        {/* Category + Amount */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                              <Tag size={12} /> Membership Category
                            </label>
                            <p className="text-xs text-gray-400 mb-2">
                              Selecting a category auto-fills the standard fee amount.
                            </p>
                            <div className="relative">
                              <select value={fCategoryId} onChange={(e) => onCategoryChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none">
                                <option value="">No category / custom amount</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                          </div>

                          <div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                              <Banknote size={12} /> Amount (Rs) <span className="text-red-400">*</span>
                            </label>
                            <p className="text-xs text-gray-400 mb-2">
                              Auto-filled from category. You can edit this if the amount differs.
                            </p>
                            <input
                              type="number" min="0" step="1"
                              value={fAmount} onChange={(e) => { setFAmount(e.target.value); setFieldErrors((er) => ({ ...er, amount: "" })); }}
                              placeholder="Enter amount in rupees"
                              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400
                                ${fieldErrors.amount ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                            />
                            {fieldErrors.amount && (
                              <p className="flex items-center gap-1 text-red-600 text-xs mt-1"><AlertCircle size={11} />{fieldErrors.amount}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Step 3: Method, Notes & Review ───────────────────── */}
                    {step === 3 && (
                      <div className="space-y-5">
                        {/* Payment breakdown */}
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                            <CreditCard size={12} /> Payment Breakdown
                          </label>
                          <p className="text-xs text-gray-400 mb-2">
                            Add one line per payment method. Split across Cash + Bank Transfer if needed.
                          </p>
                          <div className="space-y-2">
                            {fBreakdown.map((line, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <select
                                    value={line.method}
                                    onChange={(e) => updateBreakdownLine(i, "method", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none"
                                  >
                                    {PAYMENT_METHODS.map(({ value, label }) => (
                                      <option key={value} value={value}>{label}</option>
                                    ))}
                                  </select>
                                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden flex-1 focus-within:ring-2 focus-within:ring-indigo-400">
                                  <span className="px-2.5 py-2 bg-gray-50 text-xs text-gray-500 border-r border-gray-200">Rs</span>
                                  <input
                                    type="number" min="0" step="1"
                                    value={line.amount}
                                    onChange={(e) => updateBreakdownLine(i, "amount", e.target.value)}
                                    placeholder="0"
                                    className="flex-1 px-2.5 py-2 text-sm focus:outline-none"
                                  />
                                </div>
                                {fBreakdown.length > 1 && (
                                  <button type="button" onClick={() => removeBreakdownLine(i)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                                    <X size={13} />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button type="button" onClick={addBreakdownLine}
                              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 transition-colors mt-1">
                              <PlusCircle size={13} /> Add another method
                            </button>
                          </div>
                          {breakdownTotal > 0 && (
                            <div className={`flex items-center justify-between mt-2 px-3 py-1.5 rounded-lg text-xs font-medium
                              ${Math.abs(breakdownTotal - Number(fAmount)) < 0.01 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                              <span>Breakdown total</span>
                              <span>Rs {breakdownTotal.toLocaleString()}{Math.abs(breakdownTotal - Number(fAmount)) >= 0.01 && ` (expected Rs ${Number(fAmount).toLocaleString()})`}</span>
                            </div>
                          )}
                          {fieldErrors.breakdown && (
                            <p className="flex items-center gap-1 text-red-600 text-xs mt-1"><AlertCircle size={11} />{fieldErrors.breakdown}</p>
                          )}
                        </div>

                        {/* Status + Receipt */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                              <BadgeCheck size={12} /> Payment Status
                            </label>
                            <p className="text-xs text-gray-400 mb-2">Has the payment been collected already?</p>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { v: "paid",    l: "Paid",    cls: "border-green-500 bg-green-50 text-green-700" },
                                { v: "pending", l: "Pending", cls: "border-amber-400 bg-amber-50 text-amber-700" },
                              ].map(({ v, l, cls }) => (
                                <button key={v} type="button" onClick={() => setFStatus(v)}
                                  className={`py-2 text-xs font-semibold rounded-lg border-2 transition-all
                                    ${fStatus === v ? cls : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                                  {l}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                              <Receipt size={12} /> Receipt Number
                            </label>
                            <p className="text-xs text-gray-400 mb-2">Optional. For record keeping and auditing.</p>
                            <input type="text" value={fReceipt} onChange={(e) => setFReceipt(e.target.value)}
                              placeholder="e.g. RCP-2024-001"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                            <FileText size={12} /> Notes
                          </label>
                          <p className="text-xs text-gray-400 mb-2">Any additional notes about this payment (optional).</p>
                          <input type="text" value={fNotes} onChange={(e) => setFNotes(e.target.value)}
                            placeholder="e.g. Late fee waived, partial payment…"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>

                        {/* Review summary */}
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Review Summary</div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Member</span>
                              <span className="font-medium text-gray-900">{selectedMember?.name ?? "—"}</span>
                            </div>
                            {selectedCategory && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Category</span>
                                <span className="font-medium text-gray-700">{selectedCategory.name}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-500">Type</span>
                              <span className="font-medium text-gray-700">{fType === "monthly" ? "Monthly Dues" : "Annual Renewal"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Period</span>
                              <span className="font-medium text-gray-700">
                                {fType === "annual_renewal" ? `Year ${fYear}` : `${MONTHS[fMonth - 1]} ${fYear}`}
                              </span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                              <span className="text-gray-700 font-semibold">Total</span>
                              <span className="font-bold text-indigo-700 text-base">Rs {breakdownTotal > 0 ? breakdownTotal.toLocaleString() : Number(fAmount || 0).toLocaleString()}</span>
                            </div>
                            {fBreakdown.filter((l) => parseFloat(l.amount) > 0).map((l, i) => (
                              <div key={i} className="flex justify-between text-xs">
                                <span className="text-gray-400 capitalize">{PAYMENT_METHODS.find((m) => m.value === l.method)?.label ?? l.method}</span>
                                <span className="text-gray-600">Rs {parseFloat(l.amount).toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="flex justify-between">
                              <span className="text-gray-500">Status</span>
                              <span className={`font-semibold ${fStatus === "paid" ? "text-green-600" : "text-amber-600"}`}>
                                {fStatus === "paid" ? "Paid" : "Pending"}
                              </span>
                            </div>
                            {fReceipt && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Receipt</span>
                                <span className="font-medium text-gray-700">{fReceipt}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {error && (
                          <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                            <AlertCircle size={13} className="shrink-0 mt-0.5" /> {error}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                <button
                  type="button" onClick={goBack}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100 ${step === 1 ? "invisible" : ""}`}
                >
                  <ArrowLeft size={14} /> Back
                </button>

                {step < 3 ? (
                  <button type="button" onClick={goNext}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] transition-colors">
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                    {saving ? <><RefreshCw size={13} className="animate-spin" /> Saving…</> : <><CheckCircle size={13} /> Save Payment</>}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-gray-400 font-medium mr-1">Filter:</span>
        {[
          { label: "All",     value: "",         key: "status" },
          { label: "Paid",    value: "paid",     key: "status" },
          { label: "Pending", value: "pending",  key: "status" },
        ].map(({ label, value }) => (
          <button key={label} onClick={() => setFilterStatus(value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border
              ${filterStatus === value
                ? "bg-[#0a1040] text-white border-[#0a1040]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
            {label}
          </button>
        ))}
        <div className="w-px h-4 bg-gray-200 mx-1" />
        {[
          { label: "All Types", value: "" },
          { label: "Monthly",   value: "monthly" },
          { label: "Annual",    value: "annual_renewal" },
        ].map(({ label, value }) => (
          <button key={label} onClick={() => setFilterType(value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border
              ${filterType === value
                ? "bg-[#0a1040] text-white border-[#0a1040]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
            {label}
          </button>
        ))}
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <div className="relative">
          <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)}
            className="pl-3 pr-7 py-1 border border-gray-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none bg-white text-gray-500">
            <option value="">All Members</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        {(filterStatus || filterType || filterMember) && (
          <button onClick={() => { setFilterStatus(""); setFilterType(""); setFilterMember(""); }}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {/* ── Payment records ── */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 text-center py-16 text-gray-400 text-sm flex flex-col items-center gap-2">
          <RefreshCw size={20} className="animate-spin opacity-30" />
          Loading payment records…
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 text-center py-16 text-gray-400 text-sm flex flex-col items-center gap-3">
          <Banknote size={32} className="opacity-20" />
          <div>
            <div className="font-medium text-gray-500">No payment records found</div>
            <div className="text-xs mt-1">
              {filterStatus || filterType || filterMember ? "Try clearing the filters above." : "Click \"Record Payment\" to add the first one."}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── Mobile cards (hidden sm+) ── */}
          <div className="sm:hidden bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {payments.map((p) => {
              const lines: BreakdownLine[] = Array.isArray(p.paymentBreakdown) ? p.paymentBreakdown : [];
              return (
                <Fragment key={p.id}>
                  <div className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{p.member.name}</p>
                        <p className="text-xs text-gray-400">{p.member.area}{p.memberCategory ? ` · ${p.memberCategory.name}` : ""}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.type === "monthly" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                          {p.type === "monthly" ? "Monthly" : "Annual"}
                        </span>
                        <span className="text-xs text-gray-400">{periodLabel(p)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-base font-bold text-gray-900">Rs {Number(p.amount).toLocaleString()}</span>
                      {p.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle size={10} /> Paid{p.paidAt ? ` · ${formatDate(p.paidAt)}` : ""}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Clock size={10} /> Pending
                        </span>
                      )}
                    </div>

                    {/* Breakdown pills */}
                    {lines.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {lines.map((l, i) => (
                          <span key={i} className="inline-flex items-center text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                            {PAYMENT_METHODS.find((m) => m.value === l.method)?.label ?? l.method} · Rs {Number(l.amount).toLocaleString()}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.receiptNumber && (
                      <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Receipt size={10} /> Receipt: {p.receiptNumber}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {p.status === "pending" && (
                        <button onClick={() => markPaid(p.id)} disabled={markingId === p.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-100 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-40 min-h-[36px]">
                          {markingId === p.id ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                          Mark Paid
                        </button>
                      )}
                      <button onClick={() => editId === p.id ? setEditId(null) : openEdit(p)}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors min-h-[36px] ${editId === p.id ? "bg-amber-50 border-amber-200 text-amber-700" : "border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600"}`}>
                        <Pencil size={11} /> Edit
                      </button>
                      {confirmDeleteId === p.id ? (
                        <span className="flex items-center gap-1 ml-auto">
                          <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}
                            className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-40 min-h-[36px]">
                            {deletingId === p.id ? <RefreshCw size={11} className="animate-spin inline" /> : "Delete"}
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)} className="p-1.5 text-gray-400 hover:text-gray-600">
                            <X size={13} />
                          </button>
                        </span>
                      ) : (
                        <button onClick={() => { setConfirmDeleteId(p.id); setEditId(null); }}
                          className="ml-auto p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors min-h-[36px]">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile inline edit panel */}
                  {editId === p.id && (
                    <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                          <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                            className="w-full px-2 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white">
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Method</label>
                          <select value={editForm.method} onChange={(e) => setEditForm((f) => ({ ...f, method: e.target.value }))}
                            className="w-full px-2 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white">
                            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Receipt #</label>
                          <input value={editForm.receiptNumber} onChange={(e) => setEditForm((f) => ({ ...f, receiptNumber: e.target.value }))}
                            placeholder="Optional"
                            className="w-full px-2 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                          <input value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                            placeholder="Optional"
                            className="w-full px-2 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditSave(p.id)} disabled={editSaving}
                          className="flex items-center gap-1 px-4 py-2 text-xs font-medium bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors min-h-[36px]">
                          {editSaving ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
                          {editSaving ? "Saving…" : "Save"}
                        </button>
                        <button onClick={() => setEditId(null)} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-2">Cancel</button>
                      </div>
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>

          {/* ── Desktop table (hidden on mobile) ── */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Member</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type · Period</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => {
                  const lines: BreakdownLine[] = Array.isArray(p.paymentBreakdown) ? p.paymentBreakdown : [];
                  return (
                    <Fragment key={p.id}>
                      <motion.tr layout className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 text-xs">{p.member.name}</div>
                          <div className="text-gray-400 text-xs">{p.member.area}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                          {p.memberCategory?.name ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.type === "monthly" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                            {p.type === "monthly" ? "Monthly" : "Annual"}
                          </span>
                          <div className="text-xs text-gray-500 mt-0.5">{periodLabel(p)}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-gray-900">Rs {Number(p.amount).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {lines.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {lines.map((l, i) => (
                                <span key={i} className="inline-flex items-center text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                                  {PAYMENT_METHODS.find((m) => m.value === l.method)?.label ?? l.method} Rs {Number(l.amount).toLocaleString()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 capitalize">
                              {p.method === "pending" ? "—" : (PAYMENT_METHODS.find((m) => m.value === p.method)?.label ?? p.method)}
                            </span>
                          )}
                          {p.receiptNumber && (
                            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Receipt size={9} />{p.receiptNumber}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {p.status === "paid" ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                <CheckCircle size={10} /> Paid
                              </span>
                              {p.paidAt && <div className="text-xs text-gray-400 mt-0.5">{formatDate(p.paidAt)}</div>}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              <Clock size={10} /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            {p.status === "pending" && (
                              <button onClick={() => markPaid(p.id)} title="Mark as paid" disabled={markingId === p.id}
                                className="text-green-500 hover:text-green-700 transition-colors disabled:opacity-40">
                                {markingId === p.id ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                              </button>
                            )}
                            <button onClick={() => editId === p.id ? setEditId(null) : openEdit(p)} title="Edit payment"
                              className={`transition-colors ${editId === p.id ? "text-amber-500" : "text-gray-300 hover:text-amber-500"}`}>
                              <Pencil size={13} />
                            </button>
                            {confirmDeleteId === p.id ? (
                              <span className="flex items-center gap-1">
                                <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}
                                  className="px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-40">
                                  {deletingId === p.id ? <RefreshCw size={11} className="animate-spin inline" /> : "Delete"}
                                </button>
                                <button onClick={() => setConfirmDeleteId(null)} className="p-0.5 text-gray-400 hover:text-gray-600">
                                  <X size={12} />
                                </button>
                              </span>
                            ) : (
                              <button onClick={() => { setConfirmDeleteId(p.id); setEditId(null); }} title="Delete record"
                                className="text-gray-300 hover:text-red-500 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>

                      {/* Inline edit row (desktop) */}
                      {editId === p.id && (
                        <tr>
                          <td colSpan={7} className="px-4 py-3 bg-amber-50/60 border-b border-amber-100">
                            <div className="flex flex-wrap gap-3 items-end">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                                <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white">
                                  <option value="paid">Paid</option>
                                  <option value="pending">Pending</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Method</label>
                                <select value={editForm.method} onChange={(e) => setEditForm((f) => ({ ...f, method: e.target.value }))}
                                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white">
                                  {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Receipt #</label>
                                <input value={editForm.receiptNumber} onChange={(e) => setEditForm((f) => ({ ...f, receiptNumber: e.target.value }))}
                                  placeholder="Optional"
                                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 w-28" />
                              </div>
                              <div className="flex-1 min-w-40">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                                <input value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                                  placeholder="Optional notes"
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleEditSave(p.id)} disabled={editSaving}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors">
                                  {editSaving ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
                                  {editSaving ? "Saving…" : "Save"}
                                </button>
                                <button onClick={() => setEditId(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
