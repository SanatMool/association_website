"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle, XCircle, Eye, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
  const [selected, setSelected] = useState<Application | null>(null);

  useEffect(() => {
    fetch("/api/membership-applications")
      .then((r) => r.json())
      .then((data: Application[]) => { setApplications(data); setLoading(false); });
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/membership-applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null);
  }

  async function deleteApplication(id: string) {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    await fetch(`/api/membership-applications/${id}`, { method: "DELETE" });
    setApplications((prev) => prev.filter((a) => a.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const counts = {
    pending:  applications.filter((a) => a.status === "pending").length,
    reviewed: applications.filter((a) => a.status === "reviewed").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Membership Applications</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {applications.length} total · {counts.pending} pending review
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        {(["pending", "reviewed", "accepted", "rejected"] as const).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <span key={s} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border ${cfg.color}`}>
              {counts[s]} {cfg.label}
            </span>
          );
        })}
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
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Venue</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Owner</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map((app) => {
                  const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-gray-50/50 cursor-pointer ${selected?.id === app.id ? "bg-amber-50/40" : ""}`}
                      onClick={() => setSelected(app)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{app.venueName}</td>
                      <td className="px-4 py-3 text-gray-500">{app.ownerName}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(app.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelected(app); }}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detail panel */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 h-fit sticky top-6">
            {selected ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selected.venueName}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(selected.createdAt)}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${STATUS_CONFIG[selected.status]?.color}`}>
                    {STATUS_CONFIG[selected.status]?.label}
                  </span>
                </div>

                <div className="space-y-2.5 mb-5 text-sm">
                  {[
                    { label: "Owner", value: selected.ownerName },
                    { label: "Phone", value: selected.phone },
                    { label: "Email", value: selected.email },
                    { label: "Location", value: selected.location },
                    { label: "Capacity", value: selected.capacity ?? "—" },
                    { label: "Website", value: selected.website ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-2">
                      <span className="text-gray-400 w-20 flex-shrink-0">{label}</span>
                      <span className="text-gray-700 font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Update Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["reviewed", "accepted", "rejected", "pending"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(selected.id, s)}
                        disabled={selected.status === s}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-default ${STATUS_CONFIG[s].color} hover:opacity-80`}
                      >
                        {s === "accepted" && <CheckCircle size={11} />}
                        {s === "rejected" && <XCircle size={11} />}
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => deleteApplication(selected.id)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 mt-2"
                  >
                    <Trash2 size={11} />
                    Delete Application
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Eye size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Select an application to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
