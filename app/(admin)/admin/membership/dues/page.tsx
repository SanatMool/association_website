"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, CheckCircle, Clock, Trash2, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Member  { id: string; name: string; area: string }
interface Category { id: string; name: string; monthlyFee: string; annualRenewalFee: string }
interface MemberLink { memberId: string; memberCategoryId: string | null }
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
  member: { id: string; name: string; area: string };
  memberCategory: { id: string; name: string } | null;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

function periodDates(type: string, month: number, year: number): { periodStart: string; periodEnd: string } {
  if (type === "annual_renewal") {
    return { periodStart: `${year}-01-01`, periodEnd: `${year}-12-31` };
  }
  const lastDay = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, "0");
  return { periodStart: `${year}-${mm}-01`, periodEnd: `${year}-${mm}-${lastDay}` };
}

export default function DuesPage() {
  const [members,    setMembers]    = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [memberLinks, setMemberLinks] = useState<MemberLink[]>([]);
  const [payments,   setPayments]   = useState<Payment[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType,   setFilterType]   = useState("");
  const [filterMember, setFilterMember] = useState("");

  // Form
  const [fMemberId,    setFMemberId]    = useState("");
  const [fCategoryId,  setFCategoryId]  = useState("");
  const [fType,        setFType]        = useState("monthly");
  const [fMonth,       setFMonth]       = useState(new Date().getMonth() + 1);
  const [fYear,        setFYear]        = useState(currentYear);
  const [fAmount,      setFAmount]      = useState("");
  const [fMethod,      setFMethod]      = useState("cash");
  const [fStatus,      setFStatus]      = useState("paid");
  const [fReceipt,     setFReceipt]     = useState("");
  const [fNotes,       setFNotes]       = useState("");

  const loadPayments = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterType)   params.set("type",   filterType);
    if (filterMember) params.set("memberId", filterMember);
    const res  = await fetch(`/api/membership/dues?${params}`);
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

  // When member changes, auto-set their category and pre-fill amount
  function onMemberChange(memberId: string) {
    setFMemberId(memberId);
    const link = memberLinks.find((l) => l.memberId === memberId);
    const catId = link?.memberCategoryId ?? "";
    setFCategoryId(catId);
    autoFillAmount(catId, fType);
  }

  function onCategoryChange(catId: string) {
    setFCategoryId(catId);
    autoFillAmount(catId, fType);
  }

  function onTypeChange(type: string) {
    setFType(type);
    autoFillAmount(fCategoryId, type);
  }

  function autoFillAmount(catId: string, type: string) {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    setFAmount(type === "annual_renewal" ? cat.annualRenewalFee : cat.monthlyFee);
  }

  async function loadMemberLinks() {
    // Load via members list — we don't have a dedicated endpoint, so skip for now
    // Category auto-fill still works via onCategoryChange
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const { periodStart, periodEnd } = periodDates(fType, fMonth, fYear);
      const body = {
        memberId:         fMemberId,
        memberCategoryId: fCategoryId || undefined,
        type:             fType,
        amount:           parseFloat(fAmount) || 0,
        periodStart, periodEnd,
        method:        fMethod,
        status:        fStatus,
        receiptNumber: fReceipt || undefined,
        notes:         fNotes  || undefined,
      };
      const res  = await fetch("/api/membership/dues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error ?? "Failed to save");
      setShowForm(false);
      resetForm();
      await loadPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setSaving(false); }
  }

  function resetForm() {
    setFMemberId(""); setFCategoryId(""); setFType("monthly");
    setFMonth(new Date().getMonth() + 1); setFYear(currentYear);
    setFAmount(""); setFMethod("cash"); setFStatus("paid");
    setFReceipt(""); setFNotes("");
  }

  async function markPaid(id: string) {
    await fetch(`/api/membership/dues/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid" }) });
    await loadPayments();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this payment record?")) return;
    await fetch(`/api/membership/dues/${id}`, { method: "DELETE" });
    await loadPayments();
  }

  const paidTotal   = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const pendingTotal = payments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);

  function periodLabel(p: Payment) {
    const d = new Date(p.periodStart);
    if (p.type === "annual_renewal") return `${d.getFullYear()}`;
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dues &amp; Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Record and track membership fee payments.</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setError(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] transition-colors"
        >
          <Plus size={14} />
          Record Payment
        </button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Records",  value: payments.length,                              color: "text-gray-700",  bg: "bg-white" },
          { label: "Paid",           value: payments.filter((p) => p.status === "paid").length, color: "text-green-700", bg: "bg-green-50" },
          { label: "Pending",        value: payments.filter((p) => p.status === "pending").length, color: "text-amber-700", bg: "bg-amber-50" },
          { label: "Amount Collected", value: `Rs ${paidTotal.toLocaleString()}`, color: "text-indigo-700", bg: "bg-indigo-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl border border-gray-100 px-4 py-3`}>
            <div className={`text-lg font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Record Payment form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-5 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Record New Payment</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Member <span className="text-red-400">*</span></label>
              <div className="relative">
                <select value={fMemberId} onChange={(e) => onMemberChange(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none">
                  <option value="">Select member…</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.area}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <div className="relative">
                <select value={fCategoryId} onChange={(e) => onCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none">
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Payment Type <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                {[{ v: "monthly", l: "Monthly" }, { v: "annual_renewal", l: "Annual Renewal" }].map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => onTypeChange(v)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${fType === v ? "bg-[#0a1040] text-white border-[#0a1040]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Period <span className="text-red-400">*</span></label>
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
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Amount (Rs) <span className="text-red-400">*</span></label>
              <input type="number" min="0" step="0.01" value={fAmount} onChange={(e) => setFAmount(e.target.value)} required placeholder="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
              <div className="relative">
                <select value={fMethod} onChange={(e) => setFMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none">
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="pending">Not Paid Yet</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <div className="flex gap-2">
                {[{ v: "paid", l: "Paid" }, { v: "pending", l: "Pending" }].map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => setFStatus(v)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${fStatus === v ? (v === "paid" ? "bg-green-600 text-white border-green-600" : "bg-amber-500 text-white border-amber-500") : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Receipt Number</label>
              <input type="text" value={fReceipt} onChange={(e) => setFReceipt(e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <input type="text" value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>

          {error && <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] transition-colors disabled:opacity-50">
              <Plus size={13} />{saving ? "Saving…" : "Save Payment"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); setError(null); }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All Types</option>
          <option value="monthly">Monthly</option>
          <option value="annual_renewal">Annual Renewal</option>
        </select>
        <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All Members</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        {(filterStatus || filterType || filterMember) && (
          <button onClick={() => { setFilterStatus(""); setFilterType(""); setFilterMember(""); }}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 underline">Clear filters</button>
        )}
      </div>

      {/* Payments table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No payment records found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Member</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Period</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Method</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Paid On</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 text-xs">{p.member.name}</div>
                    <div className="text-gray-400 text-xs">{p.member.area}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.memberCategory?.name ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.type === "monthly" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                      {p.type === "monthly" ? "Monthly" : "Annual"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 font-medium">{periodLabel(p)}</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900">Rs {Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 capitalize">{p.method === "pending" ? "—" : p.method}</td>
                  <td className="px-4 py-3">
                    {p.status === "paid" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700"><CheckCircle size={11} />Paid</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600"><Clock size={11} />Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{p.paidAt ? formatDate(p.paidAt) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.status === "pending" && (
                        <button onClick={() => markPaid(p.id)} title="Mark as paid"
                          className="text-green-500 hover:text-green-700 transition-colors">
                          <CheckCircle size={13} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(p.id)} title="Delete"
                        className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {payments.length > 0 && pendingTotal > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-amber-600 bg-amber-50/50">
            Rs {pendingTotal.toLocaleString()} pending collection
          </div>
        )}
      </div>
    </div>
  );
}
