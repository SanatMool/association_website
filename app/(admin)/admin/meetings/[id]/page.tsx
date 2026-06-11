"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, CheckCircle, Clock, ChevronDown, Save, Check, X, Sparkles, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AgendaItem  { id: string; order: number; title: string; description: string | null; outcome: string | null }
interface Expense     { id: string; description: string; amount: string; vendorId: string | null; vendorName: string | null; vendor: { id: string; name: string } | null }
interface PaymentLine  { method: string; amount: number }
interface Contribution { id: string; amount: string; method: string; status: string; notes: string | null; paidAt: string | null; paymentBreakdown: PaymentLine[] | null; member: { id: string; name: string; area: string } }
interface Minutes     { id: string; content: string; publishedAt: string | null }
interface Vendor      { id: string; name: string }
interface Member      { id: string; name: string; area: string }
interface Meeting {
  id: string; title: string; type: string; scheduledAt: string;
  venue: string | null; description: string | null; status: string;
  agendaItems: AgendaItem[]; minutes: Minutes | null;
  expenses: Expense[]; contributions: Contribution[];
  _count: { rsvps: number };
}

const TYPE_LABELS: Record<string, string> = { agm: "AGM", picnic: "Picnic", program: "Program", committee: "Committee", special: "Special" };
const STATUS_OPTIONS = ["scheduled", "completed", "cancelled"];

const PAYMENT_METHODS = [
  { value: "cash",     label: "Cash" },
  { value: "cheque",   label: "Cheque" },
  { value: "qr",       label: "QR / Digital" },
  { value: "transfer", label: "Bank Transfer" },
  { value: "esewa",    label: "eSewa" },
  { value: "khalti",   label: "Khalti" },
];

const METHOD_COLORS: Record<string, string> = {
  cash:     "bg-green-50 text-green-700",
  cheque:   "bg-blue-50 text-blue-700",
  qr:       "bg-purple-50 text-purple-700",
  transfer: "bg-indigo-50 text-indigo-700",
  esewa:    "bg-teal-50 text-teal-700",
  khalti:   "bg-pink-50 text-pink-700",
  mixed:    "bg-amber-50 text-amber-700",
  pending:  "bg-gray-100 text-gray-500",
};

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [meeting,  setMeeting]  = useState<Meeting | null>(null);
  const [vendors,  setVendors]  = useState<Vendor[]>([]);
  const [members,  setMembers]  = useState<Member[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState<"agenda" | "expenses" | "contributions" | "minutes">("agenda");

  // Agenda form
  const [agendaTitle, setAgendaTitle] = useState("");
  const [agendaDesc,  setAgendaDesc]  = useState("");
  const [savingAgenda, setSavingAgenda] = useState(false);

  // AI agenda suggestions
  const [aiSuggestions,  setAiSuggestions]  = useState<{ title: string; description: string }[]>([]);
  const [aiAgendaLoading, setAiAgendaLoading] = useState(false);
  const [aiAgendaError,   setAiAgendaError]   = useState("");

  // Expense form
  const [eVendorId,   setEVendorId]   = useState("");
  const [eVendorName, setEVendorName] = useState("");
  const [eSaveVendor, setESaveVendor] = useState(false);
  const [eDesc,       setEDesc]       = useState("");
  const [eAmount,     setEAmount]     = useState("");
  const [savingExp,   setSavingExp]   = useState(false);

  // Contribution form
  const [cMemberId,   setCMemberId]   = useState("");
  const [cBreakdown,  setCBreakdown]  = useState<{ method: string; amount: string }[]>([{ method: "cash", amount: "" }]);
  const [cStatus,     setCStatus]     = useState("paid");
  const [cNotes,      setCNotes]      = useState("");
  const [savingCon,   setSavingCon]   = useState(false);

  // Minutes
  const [minutesContent, setMinutesContent] = useState("");
  const [savingMin, setSavingMin] = useState(false);
  const [savedMin,  setSavedMin]  = useState(false);
  const [aiMinLoading, setAiMinLoading] = useState(false);
  const [aiMinError,   setAiMinError]   = useState("");

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Inline delete confirmations
  const [confirmDeleteAgendaId,  setConfirmDeleteAgendaId]  = useState<string | null>(null);
  const [confirmDeleteExpenseId, setConfirmDeleteExpenseId] = useState<string | null>(null);
  const [confirmDeleteContribId, setConfirmDeleteContribId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function showMsg(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const load = useCallback(async () => {
    const [mRes, vRes, memRes] = await Promise.all([
      fetch(`/api/meetings/${id}`),
      fetch("/api/expense-vendors"),
      fetch("/api/members"),
    ]);
    const mJson   = await mRes.json()   as { success: boolean; data: Meeting };
    const vJson   = await vRes.json()   as { success: boolean; data: Vendor[] };
    const memJson = await memRes.json() as Member[];
    if (mJson.success) {
      setMeeting(mJson.data);
      setMinutesContent(mJson.data.minutes?.content ?? "");
    }
    if (vJson.success) setVendors(vJson.data);
    if (Array.isArray(memJson)) setMembers(memJson);
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function updateStatus(status: string) {
    setUpdatingStatus(true);
    await fetch(`/api/meetings/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    await load();
    setUpdatingStatus(false);
    showMsg("Meeting status updated.");
  }

  async function addAgenda(e: React.FormEvent) {
    e.preventDefault();
    setSavingAgenda(true); setError(null);
    try {
      const res  = await fetch(`/api/meetings/${id}/agenda`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: agendaTitle, description: agendaDesc }) });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error);
      setAgendaTitle(""); setAgendaDesc("");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSavingAgenda(false); }
  }

  async function deleteAgenda(itemId: string) {
    await fetch(`/api/meetings/${id}/agenda/${itemId}`, { method: "DELETE" });
    await load();
  }

  async function generateAgendaSuggestions() {
    if (!meeting) return;
    setAiAgendaLoading(true); setAiAgendaError(""); setAiSuggestions([]);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:        "agenda",
          title:       meeting.title,
          meetingType: meeting.type,
          description: meeting.description ?? "",
          venue:       meeting.venue ?? "",
        }),
      });
      const json = await res.json() as { success: boolean; data?: { items: { title: string; description: string }[] }; error?: string };
      if (!json.success || !json.data) throw new Error(json.error ?? "Generation failed");
      setAiSuggestions(json.data.items);
    } catch (err) {
      setAiAgendaError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiAgendaLoading(false);
    }
  }

  async function addSuggestedItem(item: { title: string; description: string }) {
    await fetch(`/api/meetings/${id}/agenda`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: item.title, description: item.description }),
    });
    setAiSuggestions((prev) => prev.filter((s) => s.title !== item.title));
    await load();
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    setSavingExp(true); setError(null);
    try {
      const res  = await fetch(`/api/meetings/${id}/expenses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: eDesc, amount: parseFloat(eAmount), vendorId: eVendorId || undefined, vendorName: eVendorName || undefined, saveVendor: eSaveVendor }) });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error);
      setEVendorId(""); setEVendorName(""); setEDesc(""); setEAmount(""); setESaveVendor(false);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSavingExp(false); }
  }

  async function deleteExpense(expenseId: string) {
    await fetch(`/api/meetings/${id}/expenses/${expenseId}`, { method: "DELETE" });
    await load();
  }

  async function addContribution(e: React.FormEvent) {
    e.preventDefault();
    setSavingCon(true); setError(null);
    try {
      const breakdown = cBreakdown
        .filter((l) => l.amount.trim() !== "")
        .map((l) => ({ method: l.method, amount: parseFloat(l.amount) }))
        .filter((l) => l.amount > 0);
      if (breakdown.length === 0) throw new Error("Please enter at least one payment amount.");
      const res  = await fetch(`/api/meetings/${id}/contributions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: cMemberId, status: cStatus, notes: cNotes, paymentBreakdown: breakdown }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error);
      setCMemberId(""); setCBreakdown([{ method: "cash", amount: "" }]); setCStatus("paid"); setCNotes("");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSavingCon(false); }
  }

  async function markContribPaid(contribId: string) {
    await fetch(`/api/meetings/${id}/contributions/${contribId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid" }) });
    await load();
  }

  async function deleteContrib(contribId: string) {
    await fetch(`/api/meetings/${id}/contributions/${contribId}`, { method: "DELETE" });
    await load();
  }

  async function saveMinutes() {
    setSavingMin(true); setSavedMin(false);
    await fetch(`/api/meetings/${id}/minutes`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: minutesContent }) });
    setSavingMin(false); setSavedMin(true);
    setTimeout(() => setSavedMin(false), 2000);
  }

  async function generateMinutesWithAI() {
    if (!meeting) return;
    setAiMinLoading(true); setAiMinError("");
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "minutes",
        title: meeting.title,
        meetingType: meeting.type,
        venue: meeting.venue ?? "",
        scheduledAt: meeting.scheduledAt,
        agendaItems: meeting.agendaItems,
      }),
    });
    const json = await res.json() as { success: boolean; data?: { text: string }; error?: string };
    setAiMinLoading(false);
    if (json.success && json.data) {
      setMinutesContent(json.data.text);
      setSavedMin(false);
    } else {
      setAiMinError(json.error ?? "AI generation failed.");
    }
  }

  async function deleteMeeting() {
    setShowDeleteConfirm(false);
    await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    router.refresh();
    router.push("/admin/meetings");
  }

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">Loading…</div>;
  if (!meeting) return <div className="text-center py-20 text-gray-400 text-sm">Meeting not found.</div>;

  const totalExpenses      = meeting.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalContributions = meeting.contributions.reduce((s, c) => s + Number(c.amount), 0);
  const netCost            = totalExpenses - totalContributions;
  const pendingContribs    = meeting.contributions.filter((c) => c.status === "pending").length;

  const TABS = [
    { key: "agenda",        label: `Agenda (${meeting.agendaItems.length})` },
    { key: "expenses",      label: `Expenses (${meeting.expenses.length})` },
    { key: "contributions", label: `Contributions (${meeting.contributions.length})` },
    { key: "minutes",       label: "Minutes" },
  ] as const;

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-xl shadow-lg"
          >
            <Check size={15} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <Link href="/admin/meetings" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-5 transition-colors">
        <ArrowLeft size={13} /> Back to Meetings
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">{TYPE_LABELS[meeting.type] ?? meeting.type}</span>
            </div>
            <p className="text-sm text-gray-500">{formatDate(meeting.scheduledAt)}{meeting.venue ? ` · ${meeting.venue}` : ""}</p>
            {meeting.description && <p className="text-sm text-gray-400 mt-1">{meeting.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <select value={meeting.status} onChange={(e) => updateStatus(e.target.value)} disabled={updatingStatus}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none appearance-none pr-7 cursor-pointer">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">Delete this meeting?</span>
                <button onClick={deleteMeeting} className="text-xs font-semibold text-white bg-red-500 px-2 py-1 rounded-lg hover:bg-red-600 transition-colors">Yes, delete</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="text-xs text-gray-500 px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1.5 border border-red-100 rounded-lg transition-colors">Delete</button>
            )}
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Agenda Items</div>
            <div className="text-sm font-semibold text-gray-700">{meeting.agendaItems.length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Total Expenses</div>
            <div className="text-sm font-semibold text-red-600">Rs {totalExpenses.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Contributions</div>
            <div className="text-sm font-semibold text-green-600">Rs {totalContributions.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Net Cost</div>
            <div className={`text-sm font-semibold ${netCost > 0 ? "text-red-600" : netCost < 0 ? "text-green-600" : "text-gray-500"}`}>
              {netCost < 0 ? `Rs ${Math.abs(netCost).toLocaleString()} surplus` : `Rs ${netCost.toLocaleString()}`}
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-100">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.key ? "border-[#0a1040] text-[#0a1040]" : "border-transparent text-gray-400 hover:text-gray-700"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── AGENDA ── */}
      {activeTab === "agenda" && (
        <div className="space-y-4">
          {meeting.agendaItems.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <ol className="divide-y divide-gray-50">
                {meeting.agendaItems.map((item, i) => (
                  <li key={item.id} className="flex items-start gap-3 px-5 py-4">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0a1040] text-white text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{item.title}</div>
                      {item.description && <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>}
                      {item.outcome    && <div className="text-xs text-green-600 mt-1 bg-green-50 rounded px-2 py-0.5 inline-block">Outcome: {item.outcome}</div>}
                    </div>
                    {confirmDeleteAgendaId === item.id ? (
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => { void deleteAgenda(item.id); setConfirmDeleteAgendaId(null); }} className="text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded hover:bg-red-600 transition-colors">Delete</button>
                        <button onClick={() => setConfirmDeleteAgendaId(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={12} /></button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDeleteAgendaId(item.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0 mt-0.5 transition-colors"><Trash2 size={13} /></button>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {/* AI Suggestions */}
          {(aiSuggestions.length > 0 || aiAgendaLoading || aiAgendaError) && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-violet-600" />
                <span className="text-sm font-semibold text-violet-800">AI Suggestions</span>
                <span className="text-xs text-violet-500">— click + to add any item</span>
                {aiSuggestions.length > 0 && (
                  <button type="button" onClick={() => setAiSuggestions([])}
                    className="ml-auto text-xs text-violet-400 hover:text-violet-700 transition-colors">
                    Dismiss all
                  </button>
                )}
              </div>
              {aiAgendaLoading && <p className="text-xs text-violet-500 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Generating agenda suggestions…</p>}
              {aiAgendaError  && <p className="text-xs text-red-600">{aiAgendaError}</p>}
              {aiSuggestions.length > 0 && (
                <div className="space-y-1.5">
                  {aiSuggestions.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white border border-violet-100 rounded-lg px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{item.title}</p>
                        {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                      </div>
                      <button type="button" onClick={() => addSuggestedItem(item)}
                        className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-colors mt-0.5"
                        title="Add this item">
                        <Plus size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={addAgenda} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Add Agenda Item</h3>
              <button type="button" onClick={generateAgendaSuggestions} disabled={aiAgendaLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-50 border border-violet-200 text-violet-700 rounded-lg hover:bg-violet-100 disabled:opacity-50 transition-colors">
                {aiAgendaLoading
                  ? <><Loader2 size={11} className="animate-spin" /> Generating…</>
                  : <><Sparkles size={11} /> Suggest with AI</>}
              </button>
            </div>
            <div className="space-y-3">
              <input type="text" value={agendaTitle} onChange={(e) => setAgendaTitle(e.target.value)} required placeholder="Agenda item title"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input type="text" value={agendaDesc} onChange={(e) => setAgendaDesc(e.target.value)} placeholder="Description (optional)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <button type="submit" disabled={savingAgenda}
                className="flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] disabled:opacity-50 transition-colors">
                <Plus size={13} />{savingAgenda ? "Adding…" : "Add Item"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── EXPENSES ── */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          {meeting.expenses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendor / Supplier</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {meeting.expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-xs text-gray-500">{exp.vendor?.name ?? exp.vendorName ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{exp.description}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 text-sm">Rs {Number(exp.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        {confirmDeleteExpenseId === exp.id ? (
                          <span className="flex items-center justify-end gap-1">
                            <button onClick={() => { void deleteExpense(exp.id); setConfirmDeleteExpenseId(null); }} className="text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded hover:bg-red-600 transition-colors">Delete</button>
                            <button onClick={() => setConfirmDeleteExpenseId(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={12} /></button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmDeleteExpenseId(exp.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-100">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">Rs {totalExpenses.toLocaleString()}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <form onSubmit={addExpense} className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Expense</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Vendor / Supplier</label>
                <div className="relative">
                  <select value={eVendorId} onChange={(e) => { setEVendorId(e.target.value); if (e.target.value) setEVendorName(""); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none">
                    <option value="">Type a vendor name below…</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {!eVendorId && (
                  <div className="mt-2 space-y-1">
                    <input type="text" value={eVendorName} onChange={(e) => setEVendorName(e.target.value)} placeholder="Vendor name (free text)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    {eVendorName && (
                      <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                        <input type="checkbox" checked={eSaveVendor} onChange={(e) => setESaveVendor(e.target.checked)} className="rounded" />
                        Save to vendor list for future use
                      </label>
                    )}
                  </div>
                )}
              </div>
              <input type="text" value={eDesc} onChange={(e) => setEDesc(e.target.value)} required placeholder="Description (what was purchased)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input type="number" min="0" step="0.01" value={eAmount} onChange={(e) => setEAmount(e.target.value)} required placeholder="Amount (Rs)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <button type="submit" disabled={savingExp}
                className="flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] disabled:opacity-50 transition-colors">
                <Plus size={13} />{savingExp ? "Adding…" : "Add Expense"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── CONTRIBUTIONS ── */}
      {activeTab === "contributions" && (
        <div className="space-y-4">
          {meeting.contributions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Member</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {meeting.contributions.map((c) => {
                    const lines: PaymentLine[] = Array.isArray(c.paymentBreakdown) ? c.paymentBreakdown : [];
                    return (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-xs">{c.member.name}</div>
                        <div className="text-gray-400 text-xs">{c.member.area}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 text-sm">
                        Rs {Number(c.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {lines.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {lines.map((l, i) => (
                              <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${METHOD_COLORS[l.method] ?? "bg-gray-100 text-gray-600"}`}>
                                Rs {Number(l.amount).toLocaleString()} {PAYMENT_METHODS.find((m) => m.value === l.method)?.label ?? l.method}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${METHOD_COLORS[c.method] ?? "bg-gray-100 text-gray-500"}`}>
                            {c.method === "pending" ? "Not collected" : (PAYMENT_METHODS.find((m) => m.value === c.method)?.label ?? c.method)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.status === "paid"
                          ? <span className="inline-flex items-center gap-1 text-xs text-green-700"><CheckCircle size={11} />Paid</span>
                          : <span className="inline-flex items-center gap-1 text-xs text-amber-600"><Clock size={11} />Pending</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.status === "pending" && (
                            <button onClick={() => markContribPaid(c.id)} title="Mark paid" className="text-green-500 hover:text-green-700 transition-colors">
                              <CheckCircle size={13} />
                            </button>
                          )}
                          {confirmDeleteContribId === c.id ? (
                            <span className="flex items-center gap-1">
                              <button onClick={() => { void deleteContrib(c.id); setConfirmDeleteContribId(null); }} className="text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded hover:bg-red-600 transition-colors">Delete</button>
                              <button onClick={() => setConfirmDeleteContribId(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={12} /></button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmDeleteContribId(c.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-100">
                  <tr>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total{pendingContribs > 0 ? ` (${pendingContribs} pending)` : ""}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">Rs {totalContributions.toLocaleString()}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <form onSubmit={addContribution} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Add Member Contribution</h3>

            {/* Member */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Member <span className="text-red-400">*</span></label>
              <div className="relative">
                <select value={cMemberId} onChange={(e) => setCMemberId(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none">
                  <option value="">Select member…</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.area}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Payment breakdown */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-500">
                  Payment Breakdown <span className="text-red-400">*</span>
                </label>
                {cBreakdown.length > 1 && (
                  <span className="text-xs font-semibold text-[#0a1040]">
                    Total: Rs {cBreakdown.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {cBreakdown.map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {/* Method pill selector */}
                    <div className="relative flex-shrink-0 w-40">
                      <select
                        value={line.method}
                        onChange={(e) => setCBreakdown((prev) => prev.map((l, idx) => idx === i ? { ...l, method: e.target.value } : l))}
                        className="w-full pl-3 pr-7 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none bg-white"
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Amount */}
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">Rs</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={line.amount}
                        onChange={(e) => setCBreakdown((prev) => prev.map((l, idx) => idx === i ? { ...l, amount: e.target.value } : l))}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>

                    {/* Remove row */}
                    {cBreakdown.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCBreakdown((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add another method */}
              <button
                type="button"
                onClick={() => setCBreakdown((prev) => [...prev, { method: "cash", amount: "" }])}
                className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                <Plus size={12} /> Add another payment method
              </button>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Collection Status</label>
              <div className="flex gap-2">
                {[{ v: "paid", l: "Collected / Paid" }, { v: "pending", l: "Not yet collected" }].map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => setCStatus(v)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      cStatus === v
                        ? v === "paid"
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Choose &quot;Not yet collected&quot; to record a pledge — you can mark it paid later.
              </p>
            </div>

            {/* Notes */}
            <input
              type="text"
              value={cNotes}
              onChange={(e) => setCNotes(e.target.value)}
              placeholder="Notes (optional — e.g. receipt no., partial payment reason)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <button type="submit" disabled={savingCon}
              className="flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] disabled:opacity-50 transition-colors">
              <Plus size={13} />{savingCon ? "Adding…" : "Add Contribution"}
            </button>
          </form>
        </div>
      )}

      {/* ── MINUTES ── */}
      {activeTab === "minutes" && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Meeting Minutes</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={generateMinutesWithAI}
                disabled={aiMinLoading || savingMin}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-xs rounded-lg disabled:opacity-50 transition-colors"
              >
                {aiMinLoading ? <><Loader2 size={12} className="animate-spin" />Generating…</> : <><Sparkles size={12} />Draft with AI</>}
              </button>
              <button onClick={saveMinutes} disabled={savingMin}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1040] text-white text-xs rounded-lg hover:bg-[#0d1550] disabled:opacity-50 transition-colors">
                {savedMin ? <><Check size={12} />Saved</> : <><Save size={12} />{savingMin ? "Saving…" : "Save"}</>}
              </button>
            </div>
          </div>
          {aiMinError && (
            <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{aiMinError}</p>
          )}
          <textarea
            value={minutesContent}
            onChange={(e) => { setMinutesContent(e.target.value); setSavedMin(false); }}
            rows={16}
            placeholder="Write meeting minutes here, or click Draft with AI to generate a draft from the agenda…"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y font-mono"
          />
          <p className="text-xs text-gray-400 mt-2">Minutes are visible only to portal members, not the public.</p>
        </div>
      )}
    </div>
  );
}
