"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Clock, CheckCircle, XCircle, Eye, Trash2, AlertTriangle,
  ArrowRight, UserPlus, Lock, ExternalLink, Search, X, RotateCcw,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
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


export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmAccept, setConfirmAccept] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [sortKey, setSortKey] = useState<"venueName" | "ownerName" | "createdAt" | "status">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

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

  // Select an application (or deselect if already selected)
  function selectApp(app: Application) {
    if (selected?.id === app.id) {
      clearConfirms();
      setSelected(null);
      return;
    }
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
    setWorking(true);
    setConfirmAccept(false);
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
    setWorking(true);
    setConfirmReject(false);
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
    setWorking(true);
    setConfirmReopen(false);
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
        if (sortKey === "venueName") cmp = a.venueName.localeCompare(b.venueName);
        else if (sortKey === "ownerName") cmp = a.ownerName.localeCompare(b.ownerName);
        else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
        else cmp = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
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

  function SortIcon({ col }: { col: typeof sortKey }) {
    if (sortKey !== col) return <ChevronsUpDown size={11} className="text-gray-300 ml-1 inline" />;
    return sortDir === "asc"
      ? <ChevronUp size={11} className="text-amber-500 ml-1 inline" />
      : <ChevronDown size={11} className="text-amber-500 ml-1 inline" />;
  }

  // Reset to page 1 when search or status filter changes
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const isTerminal = selected ? selected.status === "accepted" : false;

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

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Membership Applications</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {applications.length} total · {counts.pending} pending review
        </p>
      </div>

      {/* Search + filter row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by venue, owner, or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${statusFilter === "all" ? "bg-[#0a1040] text-white border-[#0a1040]" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
          >
            All ({applications.length})
          </button>
          {(["pending", "reviewed", "accepted", "rejected"] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  statusFilter === s ? cfg.color + " ring-2 ring-offset-1 ring-amber-400" : cfg.color + " opacity-70 hover:opacity-100"
                }`}
              >
                {counts[s]} {cfg.label}
              </button>
            );
          })}
        </div>
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
        <div className="grid lg:grid-cols-3 gap-5">
          {/* List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort("venueName")}>
                    Venue <SortIcon col="venueName" />
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort("ownerName")}>
                    Owner <SortIcon col="ownerName" />
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort("createdAt")}>
                    Applied <SortIcon col="createdAt" />
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort("status")}>
                    Status <SortIcon col="status" />
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">No applications match your search.</td></tr>
                )}
                {paginated.map((app) => {
                  const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-gray-50/50 cursor-pointer ${selected?.id === app.id ? "bg-amber-50/40" : ""}`}
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
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={(e) => { e.stopPropagation(); selectApp(app); }} className="text-gray-400 hover:text-gray-600 p-1">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs text-gray-400">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "…" ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p as number)}
                          className={`w-7 h-7 text-xs rounded-lg border transition-colors ${safePage === p ? "bg-[#0a1040] text-white border-[#0a1040]" : "border-gray-200 text-gray-600 hover:bg-white"}`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 h-fit sticky top-6">
            {selected ? (
              <>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selected.venueName}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Applied {safeDate(selected.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${STATUS_CONFIG[selected.status]?.color}`}>
                      {STATUS_CONFIG[selected.status]?.label}
                    </span>
                    <button
                      onClick={() => { clearConfirms(); setSelected(null); }}
                      className="text-gray-300 hover:text-gray-500 transition-colors p-0.5 rounded"
                      title="Close"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Application details */}
                <div className="space-y-2 mb-5 text-sm">
                  {[
                    { label: "Owner",    value: selected.ownerName },
                    { label: "Phone",    value: selected.phone },
                    { label: "Email",    value: selected.email },
                    { label: "Location", value: selected.location },
                    { label: "Capacity", value: selected.capacity ?? "—" },
                    { label: "Website",  value: selected.website ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-2">
                      <span className="text-gray-400 w-20 flex-shrink-0 text-xs">{label}</span>
                      <span className="text-gray-700 font-medium text-xs">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">

                  {/* ── TERMINAL STATE: accepted ─────────────────────────── */}
                  {selected.status === "accepted" && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1">
                        <CheckCircle size={15} /> Application Accepted
                      </div>
                      <p className="text-xs text-emerald-600">
                        A member profile was automatically created from this application. You can manage it from the{" "}
                        {selected.memberId ? (
                          <Link href={`/admin/members/${selected.memberId}`} className="underline font-semibold hover:text-emerald-700">
                            Members section
                          </Link>
                        ) : (
                          <span className="font-semibold">Members section</span>
                        )}.
                      </p>
                    </div>
                  )}

                  {/* ── TERMINAL STATE: rejected ─────────────────────────── */}
                  {selected.status === "rejected" && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-1">
                        <XCircle size={15} /> Application Rejected
                      </div>
                      <p className="text-xs text-red-500 mb-3">
                        This application was rejected. If this was a mistake, you can reopen it for review.
                      </p>
                      {confirmReopen ? (
                        <div className="bg-white border border-red-200 rounded-lg p-3">
                          <p className="text-xs text-gray-700 font-medium mb-2">
                            Reopen this application and set it back to pending?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={reopenApplication}
                              disabled={working}
                              className="flex-1 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                            >
                              {working ? "Reopening…" : "Yes, Reopen"}
                            </button>
                            <button onClick={() => setConfirmReopen(false)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { clearConfirms(); setConfirmReopen(true); }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          <RotateCcw size={11} /> Reopen Application
                        </button>
                      )}
                    </div>
                  )}

                  {/* ── ACTIVE ACTIONS (non-terminal) ────────────────────── */}
                  {selected.status !== "accepted" && selected.status !== "rejected" && (
                    <>
                      {/* Lock notice */}
                      <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                        <Lock size={11} className="mt-0.5 flex-shrink-0" />
                        Accepting or rejecting is permanent and cannot be undone.
                      </div>

                      {/* Mark reviewed (only from pending) */}
                      {selected.status === "pending" && (
                        <button
                          onClick={markReviewed}
                          disabled={working}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          <Eye size={11} /> Mark as Reviewed
                        </button>
                      )}

                      {/* Accept — shows confirmation first */}
                      {confirmAccept ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs mb-2">
                            <UserPlus size={12} /> Accept this application?
                          </div>
                          <ul className="text-xs text-emerald-700 space-y-1 mb-3 list-disc list-inside">
                            <li>A member profile will be created for <strong>{selected.venueName}</strong></li>
                            <li>They will be added to the member directory</li>
                            <li>You can complete their profile afterwards</li>
                          </ul>
                          <div className="flex gap-2">
                            <button
                              onClick={acceptApplication}
                              disabled={working}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                              {working ? "Creating…" : <><CheckCircle size={11} /> Yes, Accept &amp; Create Member</>}
                            </button>
                            <button onClick={() => setConfirmAccept(false)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { clearConfirms(); setConfirmAccept(true); }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <UserPlus size={11} /> Accept &amp; Create Member Profile
                          <ArrowRight size={11} />
                        </button>
                      )}

                      {/* Reject — shows confirmation first */}
                      {confirmReject ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                          <p className="text-xs text-red-700 font-medium mb-2">
                            Reject this application? This cannot be undone.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={rejectApplication}
                              disabled={working}
                              className="flex-1 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              {working ? "Rejecting…" : "Yes, Reject"}
                            </button>
                            <button onClick={() => setConfirmReject(false)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { clearConfirms(); setConfirmReject(true); }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <XCircle size={11} /> Reject Application
                        </button>
                      )}
                    </>
                  )}

                  {/* Delete — hidden for accepted applications */}
                  {selected.status !== "accepted" && (
                  <div className="pt-1 border-t border-gray-100">
                    {confirmDeleteId === selected.id ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-700 font-medium mb-2 flex items-center gap-1.5">
                          <AlertTriangle size={11} /> Permanently delete this record?
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => deleteApplication(selected.id)} className="flex-1 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                            Yes, delete
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { clearConfirms(); setConfirmDeleteId(selected.id); }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-400 hover:text-red-500 border border-gray-100 rounded-lg hover:border-red-200 transition-colors"
                      >
                        <Trash2 size={11} /> Delete Application Record
                      </button>
                    )}
                  </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Eye size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Select an application to review</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
