"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, CheckCircle, Clock, ChevronDown, Save, Check, X,
  Sparkles, Loader2, Calendar, MapPin, Languages, ListChecks, Receipt,
  Users, FileText, Pencil, Building2, UserCheck, Bell, Globe, EyeOff, Send,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AgendaItem  { id: string; order: number; title: string; description: string | null; outcome: string | null; resolved: boolean }
interface Expense     { id: string; description: string; amount: string; vendorId: string | null; vendorName: string | null; vendor: { id: string; name: string } | null }
interface PaymentLine  { method: string; amount: number }
interface Contribution { id: string; amount: string; method: string; status: string; notes: string | null; paidAt: string | null; paymentBreakdown: PaymentLine[] | null; member: { id: string; name: string; area: string } }
interface Minutes     { id: string; content: string; contentNe: string | null; publishedAt: string | null }
interface Vendor      { id: string; name: string }
interface Member      { id: string; name: string; area: string; image: string | null }
interface AttendanceMember { id: string; name: string; area: string; image: string | null }
interface AttendanceRecord { id: string; memberId: string; note: string | null; member: AttendanceMember }
interface Meeting {
  id: string; title: string; titleNe: string | null; type: string; scheduledAt: string;
  venue: string | null; description: string | null; descriptionNe: string | null; status: string;
  agendaItems: AgendaItem[]; minutes: Minutes | null;
  expenses: Expense[]; contributions: Contribution[];
  attendance: AttendanceRecord[];
  _count: { rsvps: number; attendance: number };
}

const TYPE_LABELS: Record<string, string> = { agm: "AGM", picnic: "Picnic", program: "Program", committee: "Committee", special: "Special" };
const TYPE_COLORS: Record<string, string> = {
  agm: "bg-purple-50 text-purple-700", picnic: "bg-green-50 text-green-700",
  program: "bg-blue-50 text-blue-700", committee: "bg-amber-50 text-amber-700", special: "bg-rose-50 text-rose-700",
};
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
  const [activeTab, setActiveTab] = useState<"agenda" | "attendance" | "expenses" | "contributions" | "minutes" | "notify">("agenda");

  // Agenda form
  const [agendaTitle, setAgendaTitle] = useState("");
  const [agendaDesc,  setAgendaDesc]  = useState("");
  const [savingAgenda, setSavingAgenda] = useState(false);

  // Agenda resolution / outcome
  const [editingOutcomeId,   setEditingOutcomeId]   = useState<string | null>(null);
  const [editingOutcomeText, setEditingOutcomeText] = useState("");
  const [savingOutcome,      setSavingOutcome]      = useState(false);
  const [togglingResolveId,  setTogglingResolveId]  = useState<string | null>(null);

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

  // Attendance
  const [attendanceSearch,  setAttendanceSearch]  = useState("");
  const [markingAttendId,   setMarkingAttendId]   = useState<string | null>(null);
  const [bulkingAttendance, setBulkingAttendance] = useState(false);

  // Minutes
  const [minutesContent,   setMinutesContent]   = useState("");
  const [minutesContentNe, setMinutesContentNe] = useState("");
  const [savingMin,        setSavingMin]        = useState(false);
  const [savedMin,         setSavedMin]         = useState(false);
  const [aiMinLoading,     setAiMinLoading]     = useState(false);
  const [aiMinError,       setAiMinError]       = useState("");
  const [translatingMinNe, setTranslatingMinNe] = useState(false);
  const [publishingMin,    setPublishingMin]    = useState(false);

  // Notifications
  const [notifyType,      setNotifyType]      = useState<"meeting_notice" | "minutes_published">("meeting_notice");
  const [notifyCustomMsg, setNotifyCustomMsg] = useState("");
  const [notifySending,   setNotifySending]   = useState(false);
  const [notifySentCount, setNotifySentCount] = useState<number | null>(null);
  const [notifyFailedCount, setNotifyFailedCount] = useState<number>(0);
  const [notifyError,     setNotifyError]     = useState("");

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Nepali fields inline edit
  const [showEditNepali,    setShowEditNepali]    = useState(false);
  const [editTitleNe,       setEditTitleNe]       = useState("");
  const [editDescNe,        setEditDescNe]        = useState("");
  const [savingNepali,      setSavingNepali]      = useState(false);
  const [translatingTitleNe, setTranslatingTitleNe] = useState(false);
  const [translatingDescNe,  setTranslatingDescNe]  = useState(false);
  const titleNeManualRef = useRef(false);
  const descNeManualRef  = useRef(false);

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
      setMinutesContentNe(mJson.data.minutes?.contentNe ?? "");
    }
    if (vJson.success) setVendors(vJson.data);
    if (Array.isArray(memJson)) setMembers(memJson);
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  function openEditNepali() {
    if (!meeting) return;
    titleNeManualRef.current = false;
    descNeManualRef.current  = false;
    setEditTitleNe(meeting.titleNe ?? "");
    setEditDescNe(meeting.descriptionNe ?? "");
    setShowEditNepali(true);
  }

  async function translateTitleNe() {
    if (!meeting) return;
    setTranslatingTitleNe(true);
    try {
      const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(meeting.title)}&langpair=en|ne`);
      const j = await r.json() as { responseData?: { translatedText?: string } };
      const t = j.responseData?.translatedText ?? "";
      if (t && !t.toLowerCase().includes("mymemory")) {
        titleNeManualRef.current = false;
        setEditTitleNe(t);
      }
    } catch { /* ignore */ }
    setTranslatingTitleNe(false);
  }

  async function translateDescNe() {
    if (!meeting?.description) return;
    setTranslatingDescNe(true);
    try {
      const r = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "translate", text: meeting.description, targetLang: "ne" }),
      });
      const j = await r.json() as { success: boolean; data?: { text: string } };
      if (j.success && j.data?.text) {
        descNeManualRef.current = false;
        setEditDescNe(j.data.text);
      }
    } catch { /* ignore */ }
    setTranslatingDescNe(false);
  }

  async function saveNepaliFields() {
    setSavingNepali(true);
    await fetch(`/api/meetings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleNe: editTitleNe, descriptionNe: editDescNe }),
    });
    await load();
    setSavingNepali(false);
    setShowEditNepali(false);
    showMsg("Nepali fields saved.");
  }

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

  async function toggleResolved(item: AgendaItem) {
    setTogglingResolveId(item.id);
    await fetch(`/api/meetings/${id}/agenda/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: !item.resolved }),
    });
    await load();
    setTogglingResolveId(null);
  }

  async function saveOutcome(itemId: string) {
    setSavingOutcome(true);
    await fetch(`/api/meetings/${id}/agenda/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome: editingOutcomeText }),
    });
    setSavingOutcome(false);
    setEditingOutcomeId(null);
    await load();
    showMsg("Outcome saved.");
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

  async function toggleAttendance(memberId: string, isPresent: boolean) {
    setMarkingAttendId(memberId);
    if (isPresent) {
      await fetch(`/api/meetings/${id}/attendance?memberId=${memberId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/meetings/${id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
    }
    await load();
    setMarkingAttendId(null);
  }

  async function bulkAttendance() {
    setBulkingAttendance(true);
    await fetch(`/api/meetings/${id}/attendance/bulk`, { method: "POST" });
    await load();
    setBulkingAttendance(false);
  }

  async function saveMinutes() {
    setSavingMin(true); setSavedMin(false);
    await fetch(`/api/meetings/${id}/minutes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content:   minutesContent,
        contentNe: minutesContentNe || undefined,
      }),
    });
    await load();
    setSavingMin(false); setSavedMin(true);
    setTimeout(() => setSavedMin(false), 2000);
  }

  async function publishMinutes() {
    setPublishingMin(true);
    await fetch(`/api/meetings/${id}/minutes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: minutesContent, publish: true }),
    });
    await load();
    setPublishingMin(false);
    showMsg("Minutes published to member portal.");
  }

  async function unpublishMinutes() {
    setPublishingMin(true);
    await fetch(`/api/meetings/${id}/minutes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unpublish: true }),
    });
    await load();
    setPublishingMin(false);
    showMsg("Minutes unpublished.");
  }

  async function translateMinutesNe() {
    if (!minutesContent) return;
    setTranslatingMinNe(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "translate", text: minutesContent, targetLang: "ne" }),
      });
      const j = await res.json() as { success: boolean; data?: { text: string } };
      if (j.success && j.data?.text) setMinutesContentNe(j.data.text);
    } catch { /* ignore */ }
    setTranslatingMinNe(false);
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

  async function sendNotification() {
    setNotifySending(true); setNotifyError(""); setNotifySentCount(null); setNotifyFailedCount(0);
    try {
      const res = await fetch(`/api/meetings/${id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: notifyType, customMessage: notifyCustomMsg || undefined }),
      });
      const json = await res.json() as { success: boolean; data?: { sent: number; failed: number }; error?: string };
      if (!json.success) throw new Error(json.error ?? "Failed to send");
      setNotifySentCount(json.data?.sent ?? 0);
      setNotifyFailedCount(json.data?.failed ?? 0);
      const failedSuffix = json.data?.failed ? ` (${json.data.failed} failed — check Portal Accounts for flagged emails)` : "";
      showMsg(`Notification sent to ${json.data?.sent ?? 0} members.${failedSuffix}`);
    } catch (err) {
      setNotifyError(err instanceof Error ? err.message : "Failed to send notification");
    }
    setNotifySending(false);
  }

  async function deleteMeeting() {
    setShowDeleteConfirm(false);
    await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    router.refresh();
    router.push("/admin/meetings");
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
      <Loader2 size={16} className="animate-spin" /> Loading…
    </div>
  );
  if (!meeting) return <div className="text-center py-20 text-gray-400 text-sm">Meeting not found.</div>;

  const totalExpenses      = meeting.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalContributions = meeting.contributions.reduce((s, c) => s + Number(c.amount), 0);
  const netCost            = totalExpenses - totalContributions;
  const pendingContribs    = meeting.contributions.filter((c) => c.status === "pending").length;
  const attendanceCount    = meeting.attendance.length;
  const presentIds         = new Set(meeting.attendance.map((a) => a.memberId));
  const resolvedCount      = meeting.agendaItems.filter((a) => a.resolved).length;

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
    m.area.toLowerCase().includes(attendanceSearch.toLowerCase())
  );

  const TABS = [
    { key: "agenda",        label: "Agenda",        count: meeting.agendaItems.length,  icon: <ListChecks size={13} /> },
    { key: "attendance",    label: "Attendance",    count: attendanceCount,              icon: <UserCheck size={13} /> },
    { key: "expenses",      label: "Expenses",      count: meeting.expenses.length,      icon: <Receipt size={13} /> },
    { key: "contributions", label: "Contributions", count: meeting.contributions.length, icon: <Users size={13} /> },
    { key: "minutes",       label: "Minutes",       count: null,                         icon: <FileText size={13} /> },
    { key: "notify",        label: "Notify",        count: null,                         icon: <Bell size={13} /> },
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
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[meeting.type] ?? "bg-gray-100 text-gray-600"}`}>
                {TYPE_LABELS[meeting.type] ?? meeting.type}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{meeting.title}</h1>
            {meeting.titleNe && (
              <p className="text-sm text-gray-500 mt-0.5 font-medium">{meeting.titleNe}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(meeting.scheduledAt)}</span>
              {meeting.venue && <span className="flex items-center gap-1"><Building2 size={11} />{meeting.venue}</span>}
            </div>
            {meeting.description && (
              <p className="text-sm text-gray-500 mt-2">{meeting.description}</p>
            )}
            {meeting.descriptionNe && (
              <p className="text-sm text-gray-400 mt-1">{meeting.descriptionNe}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-shrink-0">
            <button
              onClick={openEditNepali}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors min-h-[36px]"
            >
              <Languages size={12} /> Nepali
            </button>
            <div className="relative">
              <select value={meeting.status} onChange={(e) => updateStatus(e.target.value)} disabled={updatingStatus}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none appearance-none pr-7 cursor-pointer min-h-[36px]">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium whitespace-nowrap">Delete this meeting?</span>
                <button onClick={deleteMeeting} className="text-xs font-semibold text-white bg-red-500 px-2 py-1.5 rounded-lg hover:bg-red-600 transition-colors">Yes, delete</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="text-xs text-gray-500 px-2 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)} className="text-xs text-red-400 hover:text-red-600 px-2 py-2 border border-red-100 rounded-xl transition-colors min-h-[36px]">Delete</button>
            )}
          </div>
        </div>

        {/* Nepali fields inline edit */}
        <AnimatePresence>
          {showEditNepali && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Languages size={13} className="text-indigo-500" />
                  <span className="text-xs font-semibold text-gray-600">Edit Nepali Fields</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-500">Title (Nepali)</label>
                      <button type="button" onClick={translateTitleNe} disabled={translatingTitleNe}
                        className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 disabled:opacity-50 transition-colors">
                        {translatingTitleNe ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />}
                        Translate
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editTitleNe}
                      onChange={(e) => { titleNeManualRef.current = true; setEditTitleNe(e.target.value); }}
                      placeholder="शीर्षक नेपालीमा…"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-500">Description (Nepali)</label>
                      <button type="button" onClick={translateDescNe} disabled={translatingDescNe || !meeting.description}
                        className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 disabled:opacity-50 transition-colors">
                        {translatingDescNe ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />}
                        Translate
                      </button>
                    </div>
                    <textarea
                      value={editDescNe}
                      onChange={(e) => { descNeManualRef.current = true; setEditDescNe(e.target.value); }}
                      rows={3}
                      placeholder="विवरण नेपालीमा…"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={saveNepaliFields} disabled={savingNepali}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0a1040] text-white text-xs font-medium rounded-xl hover:bg-[#0d1550] disabled:opacity-50 transition-colors min-h-[36px]">
                    {savingNepali ? <><Loader2 size={11} className="animate-spin" /> Saving…</> : <><Save size={11} /> Save Nepali Fields</>}
                  </button>
                  <button onClick={() => setShowEditNepali(false)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-h-[36px]">
                    <X size={11} /> Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
              <ListChecks size={10} /> Agenda
            </div>
            <div className="text-sm font-semibold text-gray-700">
              {resolvedCount}/{meeting.agendaItems.length}
              <span className="text-xs font-normal text-gray-400 ml-1">resolved</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
              <UserCheck size={10} /> Attendance
            </div>
            <div className="text-sm font-semibold text-gray-700">{attendanceCount}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
              <Receipt size={10} /> Expenses
            </div>
            <div className="text-sm font-semibold text-red-600">Rs {totalExpenses.toLocaleString()}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
              <Users size={10} /> Contributions
            </div>
            <div className="text-sm font-semibold text-green-600">Rs {totalContributions.toLocaleString()}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
              <MapPin size={10} /> Net Cost
            </div>
            <div className={`text-sm font-semibold ${netCost > 0 ? "text-red-600" : netCost < 0 ? "text-green-600" : "text-gray-500"}`}>
              {netCost < 0 ? `Rs ${Math.abs(netCost).toLocaleString()} surplus` : `Rs ${netCost.toLocaleString()}`}
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{error}</p>}

      {/* Tabs */}
      <div className="overflow-x-auto -mx-1 px-1 mb-4">
        <div className="flex gap-1 border-b border-gray-100 min-w-max">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === tab.key ? "border-[#0a1040] text-[#0a1040]" : "border-transparent text-gray-400 hover:text-gray-700"}`}>
              {tab.icon}
              {tab.label}
              {tab.count !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${activeTab === tab.key ? "bg-[#0a1040] text-white" : "bg-gray-100 text-gray-500"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── AGENDA ── */}
      {activeTab === "agenda" && (
        <div className="space-y-4">
          {meeting.agendaItems.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <ol className="divide-y divide-gray-50">
                {meeting.agendaItems.map((item, i) => (
                  <li key={item.id} className="px-4 sm:px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold mt-0.5 ${item.resolved ? "bg-green-500" : "bg-[#0a1040]"}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm ${item.resolved ? "text-gray-500 line-through" : "text-gray-900"}`}>{item.title}</div>
                            {item.description && <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>}
                          </div>
                          {/* Resolved toggle */}
                          <button
                            onClick={() => toggleResolved(item)}
                            disabled={togglingResolveId === item.id}
                            title={item.resolved ? "Mark unresolved" : "Mark resolved"}
                            className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors min-h-[28px] ${item.resolved ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                          >
                            {togglingResolveId === item.id
                              ? <Loader2 size={10} className="animate-spin" />
                              : <CheckCircle size={10} />}
                            {item.resolved ? "Resolved" : "Resolve"}
                          </button>
                        </div>

                        {/* Outcome section */}
                        {item.resolved && (
                          <div className="mt-2">
                            {editingOutcomeId === item.id ? (
                              <div className="flex items-start gap-2">
                                <input
                                  type="text"
                                  value={editingOutcomeText}
                                  onChange={(e) => setEditingOutcomeText(e.target.value)}
                                  placeholder="Describe the resolution or outcome…"
                                  autoFocus
                                  className="flex-1 px-2.5 py-1.5 border border-indigo-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                                <button
                                  onClick={() => saveOutcome(item.id)}
                                  disabled={savingOutcome}
                                  className="flex items-center gap-1 text-xs px-2 py-1.5 bg-[#0a1040] text-white rounded-lg hover:bg-[#0d1550] disabled:opacity-50 transition-colors whitespace-nowrap"
                                >
                                  {savingOutcome ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingOutcomeId(null)}
                                  className="text-gray-400 hover:text-gray-600 p-1.5 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : item.outcome ? (
                              <div className="flex items-start gap-2">
                                <div className="flex-1 text-xs text-green-700 bg-green-50 border border-green-100 rounded px-2 py-1">
                                  <span className="font-medium">Outcome: </span>{item.outcome}
                                </div>
                                <button
                                  onClick={() => { setEditingOutcomeId(item.id); setEditingOutcomeText(item.outcome ?? ""); }}
                                  className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
                                  title="Edit outcome"
                                >
                                  <Pencil size={11} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditingOutcomeId(item.id); setEditingOutcomeText(""); }}
                                className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                              >
                                <Plus size={10} /> Add outcome / resolution
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {confirmDeleteAgendaId === item.id ? (
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => { void deleteAgenda(item.id); setConfirmDeleteAgendaId(null); }} className="text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded hover:bg-red-600 transition-colors">Delete</button>
                          <button onClick={() => setConfirmDeleteAgendaId(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={12} /></button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmDeleteAgendaId(item.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0 mt-0.5 transition-colors min-h-[44px] flex items-center"><Trash2 size={13} /></button>
                      )}
                    </div>
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
                        className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-colors mt-0.5"
                        title="Add this item">
                        <Plus size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={addAgenda} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><ListChecks size={14} className="text-indigo-400" /> Add Agenda Item</h3>
              <button type="button" onClick={generateAgendaSuggestions} disabled={aiAgendaLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-50 border border-violet-200 text-violet-700 rounded-xl hover:bg-violet-100 disabled:opacity-50 transition-colors">
                {aiAgendaLoading
                  ? <><Loader2 size={11} className="animate-spin" /> Generating…</>
                  : <><Sparkles size={11} /> Suggest with AI</>}
              </button>
            </div>
            <div className="space-y-3">
              <input type="text" value={agendaTitle} onChange={(e) => setAgendaTitle(e.target.value)} required placeholder="Agenda item title"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input type="text" value={agendaDesc} onChange={(e) => setAgendaDesc(e.target.value)} placeholder="Description (optional)"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <button type="submit" disabled={savingAgenda}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm rounded-xl hover:bg-[#0d1550] disabled:opacity-50 transition-colors min-h-[44px]">
                <Plus size={13} />{savingAgenda ? "Adding…" : "Add Item"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── ATTENDANCE ── */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          {/* Present members summary */}
          {meeting.attendance.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
                <UserCheck size={14} className="text-green-500" />
                Present ({meeting.attendance.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {meeting.attendance.map((a) => (
                  <div key={a.id} className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5">
                    <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-green-700 text-xs font-bold flex-shrink-0">
                      {a.member.name.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-green-800">{a.member.name}</span>
                    <span className="text-xs text-green-500">{a.member.area}</span>
                    <button
                      onClick={() => toggleAttendance(a.memberId, true)}
                      disabled={markingAttendId === a.memberId}
                      className="text-green-300 hover:text-red-500 transition-colors ml-1"
                      title="Remove from attendance"
                    >
                      {markingAttendId === a.memberId ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Member checklist */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[160px]">
                  <input
                    type="text"
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                    placeholder="Search members…"
                    className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  {attendanceSearch && (
                    <button onClick={() => setAttendanceSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                      <X size={13} />
                    </button>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{attendanceCount}/{members.length} present</span>
                {meeting._count.rsvps > 0 && (
                  <button
                    onClick={bulkAttendance}
                    disabled={bulkingAttendance}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-xl hover:bg-green-100 transition-colors disabled:opacity-60 whitespace-nowrap"
                    title="Mark all members who RSVPed as attending as present"
                  >
                    {bulkingAttendance ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                    Mark RSVPs Present
                  </button>
                )}
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-8">No members match your search.</p>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {filteredMembers.map((m) => {
                  const isPresent = presentIds.has(m.id);
                  const isLoading = markingAttendId === m.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isPresent ? "bg-green-50/50 hover:bg-green-50" : "hover:bg-gray-50/80"}`}
                      onClick={() => !isLoading && toggleAttendance(m.id, isPresent)}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${isPresent ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : m.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${isPresent ? "text-gray-900" : "text-gray-600"}`}>{m.name}</div>
                        <div className="text-xs text-gray-400">{m.area}</div>
                      </div>
                      <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isPresent ? "bg-green-500 border-green-500" : "border-gray-200"}`}>
                        {isPresent && <Check size={11} className="text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EXPENSES ── */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          {meeting.expenses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {meeting.expenses.map((exp) => (
                  <div key={exp.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{exp.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Building2 size={10} />{exp.vendor?.name ?? exp.vendorName ?? "No vendor"}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">Rs {Number(exp.amount).toLocaleString()}</p>
                    </div>
                    {confirmDeleteExpenseId === exp.id ? (
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => { void deleteExpense(exp.id); setConfirmDeleteExpenseId(null); }} className="text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded hover:bg-red-600 transition-colors">Delete</button>
                        <button onClick={() => setConfirmDeleteExpenseId(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={12} /></button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDeleteExpenseId(exp.id)} className="text-gray-300 hover:text-red-500 transition-colors min-h-[44px] flex items-center"><Trash2 size={13} /></button>
                    )}
                  </div>
                ))}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Total</span>
                  <span className="text-sm font-bold text-gray-900">Rs {totalExpenses.toLocaleString()}</span>
                </div>
              </div>
              {/* Desktop table */}
              <table className="hidden md:table w-full text-sm">
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

          <form onSubmit={addExpense} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5"><Receipt size={14} className="text-amber-400" /> Add Expense</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Vendor / Supplier</label>
                <div className="relative">
                  <select value={eVendorId} onChange={(e) => { setEVendorId(e.target.value); if (e.target.value) setEVendorName(""); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none">
                    <option value="">Type a vendor name below…</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {!eVendorId && (
                  <div className="mt-2 space-y-1">
                    <input type="text" value={eVendorName} onChange={(e) => setEVendorName(e.target.value)} placeholder="Vendor name (free text)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
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
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input type="number" min="0" step="0.01" value={eAmount} onChange={(e) => setEAmount(e.target.value)} required placeholder="Amount (Rs)"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <button type="submit" disabled={savingExp}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm rounded-xl hover:bg-[#0d1550] disabled:opacity-50 transition-colors min-h-[44px]">
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
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {meeting.contributions.map((c) => {
                  const lines: PaymentLine[] = Array.isArray(c.paymentBreakdown) ? c.paymentBreakdown : [];
                  return (
                    <div key={c.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{c.member.name}</p>
                          <p className="text-xs text-gray-400">{c.member.area}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-gray-900">Rs {Number(c.amount).toLocaleString()}</p>
                          <span className={`text-xs ${c.status === "paid" ? "text-green-600" : "text-amber-600"}`}>
                            {c.status === "paid" ? "Paid" : "Pending"}
                          </span>
                        </div>
                      </div>
                      {lines.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {lines.map((l, i) => (
                            <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${METHOD_COLORS[l.method] ?? "bg-gray-100 text-gray-600"}`}>
                              Rs {Number(l.amount).toLocaleString()} {PAYMENT_METHODS.find((m) => m.value === l.method)?.label ?? l.method}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {c.status === "pending" && (
                          <button onClick={() => markContribPaid(c.id)}
                            className="flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-100 px-2 py-1 rounded-lg hover:bg-green-100 transition-colors">
                            <CheckCircle size={11} /> Mark Paid
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
                    </div>
                  );
                })}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Total{pendingContribs > 0 ? ` (${pendingContribs} pending)` : ""}</span>
                  <span className="text-sm font-bold text-gray-900">Rs {totalContributions.toLocaleString()}</span>
                </div>
              </div>
              {/* Desktop table */}
              <table className="hidden md:table w-full text-sm">
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

          <form onSubmit={addContribution} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Users size={14} className="text-green-500" /> Add Member Contribution</h3>

            {/* Member */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Member <span className="text-red-400">*</span></label>
              <div className="relative">
                <select value={cMemberId} onChange={(e) => setCMemberId(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none">
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
                    <div className="relative flex-shrink-0 w-40">
                      <select
                        value={line.method}
                        onChange={(e) => setCBreakdown((prev) => prev.map((l, idx) => idx === i ? { ...l, method: e.target.value } : l))}
                        className="w-full pl-3 pr-7 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none bg-white"
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">Rs</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={line.amount}
                        onChange={(e) => setCBreakdown((prev) => prev.map((l, idx) => idx === i ? { ...l, amount: e.target.value } : l))}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
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
                    className={`flex-1 py-2.5 text-xs font-medium rounded-xl border transition-colors min-h-[44px] ${
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
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <button type="submit" disabled={savingCon}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm rounded-xl hover:bg-[#0d1550] disabled:opacity-50 transition-colors min-h-[44px]">
              <Plus size={13} />{savingCon ? "Adding…" : "Add Contribution"}
            </button>
          </form>
        </div>
      )}

      {/* ── MINUTES ── */}
      {activeTab === "minutes" && (
        <div className="space-y-4">
          {/* Publish status bar */}
          <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${meeting.minutes?.publishedAt ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
            <div className="flex items-center gap-2">
              {meeting.minutes?.publishedAt ? (
                <>
                  <Globe size={13} className="text-green-600" />
                  <span className="text-xs font-medium text-green-800">
                    Published — visible to portal members
                  </span>
                </>
              ) : (
                <>
                  <EyeOff size={13} className="text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">Draft — not yet visible to members</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {meeting.minutes?.publishedAt ? (
                <button onClick={unpublishMinutes} disabled={publishingMin}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors">
                  {publishingMin ? <Loader2 size={11} className="animate-spin" /> : <EyeOff size={11} />}
                  Unpublish
                </button>
              ) : (
                <button onClick={publishMinutes} disabled={publishingMin || !minutesContent.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 border border-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {publishingMin ? <Loader2 size={11} className="animate-spin" /> : <Globe size={11} />}
                  Publish to Portal
                </button>
              )}
            </div>
          </div>

          {/* English minutes */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><FileText size={14} className="text-blue-400" /> Minutes (English)</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={generateMinutesWithAI}
                  disabled={aiMinLoading || savingMin}
                  className="flex items-center gap-1.5 px-3 py-2 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-xs rounded-xl disabled:opacity-50 transition-colors min-h-[36px]"
                >
                  {aiMinLoading ? <><Loader2 size={12} className="animate-spin" />Generating…</> : <><Sparkles size={12} />Draft with AI</>}
                </button>
                <button onClick={saveMinutes} disabled={savingMin}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#0a1040] text-white text-xs rounded-xl hover:bg-[#0d1550] disabled:opacity-50 transition-colors min-h-[36px]">
                  {savedMin ? <><Check size={12} />Saved</> : <><Save size={12} />{savingMin ? "Saving…" : "Save"}</>}
                </button>
              </div>
            </div>
            {aiMinError && (
              <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{aiMinError}</p>
            )}
            <textarea
              value={minutesContent}
              onChange={(e) => { setMinutesContent(e.target.value); setSavedMin(false); }}
              rows={14}
              placeholder="Write meeting minutes here, or click Draft with AI to generate a draft from the agenda…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y font-mono"
            />
          </div>

          {/* Nepali minutes */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Languages size={14} className="text-indigo-400" /> Minutes (Nepali — optional)
              </h3>
              <button
                onClick={translateMinutesNe}
                disabled={translatingMinNe || !minutesContent.trim()}
                className="flex items-center gap-1.5 px-3 py-2 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-xs rounded-xl disabled:opacity-50 transition-colors min-h-[36px]"
              >
                {translatingMinNe ? <><Loader2 size={12} className="animate-spin" />Translating…</> : <><Languages size={12} />Translate from English</>}
              </button>
            </div>
            <textarea
              value={minutesContentNe}
              onChange={(e) => { setMinutesContentNe(e.target.value); setSavedMin(false); }}
              rows={10}
              placeholder="नेपालीमा बैठकको कार्यविवरण लेख्नुहोस्…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
            />
            <p className="text-xs text-gray-400 mt-2">Both English and Nepali minutes are saved together via the Save button above.</p>
          </div>
        </div>
      )}

      {/* ── NOTIFY ── */}
      {activeTab === "notify" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-1">
              <Bell size={14} className="text-amber-500" /> Notify Members
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              Send an email to all members who have a portal account. Emails are sent immediately.
            </p>

            {/* Notification type */}
            <div className="space-y-2 mb-5">
              <label className="text-xs font-medium text-gray-500 block mb-2">Notification Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    value: "meeting_notice" as const,
                    label: "Meeting Notice",
                    desc: "Notify members about the upcoming meeting with date, venue, and agenda.",
                    icon: <Calendar size={16} className="text-blue-500" />,
                  },
                  {
                    value: "minutes_published" as const,
                    label: "Minutes Published",
                    desc: "Inform members that the meeting minutes are now available on the portal.",
                    icon: <FileText size={16} className="text-green-500" />,
                    disabled: !meeting.minutes?.publishedAt,
                    disabledReason: "Publish the minutes first before sending this notification.",
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => !opt.disabled && setNotifyType(opt.value)}
                    disabled={opt.disabled}
                    className={`text-left p-4 rounded-xl border-2 transition-colors ${
                      notifyType === opt.value
                        ? "border-[#0a1040] bg-[#0a1040]/5"
                        : opt.disabled
                        ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                        : "border-gray-200 hover:border-gray-300 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {opt.icon}
                      <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                      {notifyType === opt.value && <Check size={13} className="text-[#0a1040] ml-auto" />}
                    </div>
                    <p className="text-xs text-gray-400">{opt.disabled ? opt.disabledReason : opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom message */}
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Custom Message <span className="text-gray-400 font-normal">(optional — shown highlighted in the email)</span>
              </label>
              <textarea
                value={notifyCustomMsg}
                onChange={(e) => setNotifyCustomMsg(e.target.value)}
                rows={3}
                placeholder="Add a personal note or important announcement to include in the email…"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>

            {/* Error */}
            {notifyError && (
              <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{notifyError}</p>
            )}

            {/* Sent confirmation */}
            {notifySentCount !== null && (
              <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle size={14} className="text-green-600" />
                <span className="text-xs font-medium text-green-800">
                  Email sent to {notifySentCount} member{notifySentCount !== 1 ? "s" : ""}.
                  {notifyFailedCount > 0 && ` ${notifyFailedCount} failed — check Portal Accounts for flagged emails.`}
                </span>
              </div>
            )}

            <button
              onClick={sendNotification}
              disabled={notifySending}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0a1040] text-white text-sm font-medium rounded-xl hover:bg-[#0d1550] disabled:opacity-50 transition-colors min-h-[44px]"
            >
              {notifySending ? <><Loader2 size={14} className="animate-spin" />Sending…</> : <><Send size={14} />Send Notification</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
