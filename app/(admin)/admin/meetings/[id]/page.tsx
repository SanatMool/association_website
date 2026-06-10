"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, CheckCircle, Clock, ChevronDown, Save, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AgendaItem  { id: string; order: number; title: string; description: string | null; outcome: string | null }
interface Expense     { id: string; description: string; amount: string; vendorId: string | null; vendorName: string | null; vendor: { id: string; name: string } | null }
interface Contribution { id: string; amount: string; method: string; status: string; notes: string | null; paidAt: string | null; member: { id: string; name: string; area: string } }
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

  // Expense form
  const [eVendorId,   setEVendorId]   = useState("");
  const [eVendorName, setEVendorName] = useState("");
  const [eSaveVendor, setESaveVendor] = useState(false);
  const [eDesc,       setEDesc]       = useState("");
  const [eAmount,     setEAmount]     = useState("");
  const [savingExp,   setSavingExp]   = useState(false);

  // Contribution form
  const [cMemberId, setCMemberId] = useState("");
  const [cAmount,   setCAmount]   = useState("");
  const [cMethod,   setCMethod]   = useState("cash");
  const [cStatus,   setCStatus]   = useState("paid");
  const [cNotes,    setCNotes]    = useState("");
  const [savingCon, setSavingCon] = useState(false);

  // Minutes
  const [minutesContent, setMinutesContent] = useState("");
  const [savingMin, setSavingMin] = useState(false);
  const [savedMin,  setSavedMin]  = useState(false);

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [error, setError] = useState<string | null>(null);

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
      const res  = await fetch(`/api/meetings/${id}/contributions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId: cMemberId, amount: parseFloat(cAmount), method: cMethod, status: cStatus, notes: cNotes }) });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error);
      setCMemberId(""); setCAmount(""); setCMethod("cash"); setCStatus("paid"); setCNotes("");
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

  async function deleteMeeting() {
    if (!confirm("Delete this meeting and all its data? This cannot be undone.")) return;
    await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    router.push("/admin/meetings");
  }

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">Loading…</div>;
  if (!meeting) return <div className="text-center py-20 text-gray-400 text-sm">Meeting not found.</div>;

  const totalExpenses     = meeting.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalContributions = meeting.contributions.reduce((s, c) => s + Number(c.amount), 0);
  const pendingContribs   = meeting.contributions.filter((c) => c.status === "pending").length;

  const TABS = [
    { key: "agenda",        label: `Agenda (${meeting.agendaItems.length})` },
    { key: "expenses",      label: `Expenses (${meeting.expenses.length})` },
    { key: "contributions", label: `Contributions (${meeting.contributions.length})` },
    { key: "minutes",       label: "Minutes" },
  ] as const;

  return (
    <div>
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
            <button onClick={deleteMeeting} className="text-xs text-red-400 hover:text-red-600 px-2 py-1.5 border border-red-100 rounded-lg transition-colors">Delete</button>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
          {[
            { label: "Agenda Items",  value: meeting.agendaItems.length },
            { label: "Total Expenses", value: `Rs ${totalExpenses.toLocaleString()}` },
            { label: "Contributions",  value: `Rs ${totalContributions.toLocaleString()}` },
            { label: "Net Cost",       value: `Rs ${Math.max(0, totalExpenses - totalContributions).toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</div>
              <div className="text-sm font-semibold text-gray-700">{value}</div>
            </div>
          ))}
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
                    <button onClick={() => deleteAgenda(item.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0 mt-0.5 transition-colors"><Trash2 size={13} /></button>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <form onSubmit={addAgenda} className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Agenda Item</h3>
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
                        <button onClick={() => deleteExpense(exp.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Method</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {meeting.contributions.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-xs">{c.member.name}</div>
                        <div className="text-gray-400 text-xs">{c.member.area}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 text-sm">Rs {Number(c.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 capitalize">{c.method === "pending" ? "—" : c.method}</td>
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
                          <button onClick={() => deleteContrib(c.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
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

          <form onSubmit={addContribution} className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Member Contribution</h3>
            <div className="grid sm:grid-cols-2 gap-3">
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
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Amount (Rs) <span className="text-red-400">*</span></label>
                <input type="number" min="0" step="0.01" value={cAmount} onChange={(e) => setCAmount(e.target.value)} required placeholder="0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Method</label>
                <div className="relative">
                  <select value={cMethod} onChange={(e) => setCMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none">
                    <option value="cash">Cash</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="pending">Not collected yet</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <div className="flex gap-2">
                  {[{ v: "paid", l: "Paid" }, { v: "pending", l: "Pending" }].map(({ v, l }) => (
                    <button key={v} type="button" onClick={() => setCStatus(v)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${cStatus === v ? (v === "paid" ? "bg-green-600 text-white border-green-600" : "bg-amber-500 text-white border-amber-500") : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <input type="text" value={cNotes} onChange={(e) => setCNotes(e.target.value)} placeholder="Notes (optional)" className="w-full mt-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <button type="submit" disabled={savingCon} className="mt-3 flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] disabled:opacity-50 transition-colors">
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
            <button onClick={saveMinutes} disabled={savingMin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1040] text-white text-xs rounded-lg hover:bg-[#0d1550] disabled:opacity-50 transition-colors">
              {savedMin ? <><Check size={12} />Saved</> : <><Save size={12} />{savingMin ? "Saving…" : "Save"}</>}
            </button>
          </div>
          <textarea
            value={minutesContent}
            onChange={(e) => { setMinutesContent(e.target.value); setSavedMin(false); }}
            rows={16}
            placeholder="Write meeting minutes here…"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y font-mono"
          />
          <p className="text-xs text-gray-400 mt-2">Minutes are visible only to portal members, not the public.</p>
        </div>
      )}
    </div>
  );
}
