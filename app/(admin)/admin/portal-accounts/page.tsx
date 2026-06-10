"use client";

import { useEffect, useState } from "react";
import { KeyRound, Plus, Trash2, RefreshCw, Check, X, Eye, EyeOff } from "lucide-react";

interface PortalAccount {
  id: string;
  email: string;
  createdAt: string;
}
interface MemberRow {
  memberId: string;
  memberName: string;
  area: string;
  account: PortalAccount | null;
}

export default function PortalAccountsPage() {
  const [rows,    setRows]    = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [createId,    setCreateId]    = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPwd,   setCreatePwd]   = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [createErr,   setCreateErr]   = useState("");

  // Reset password state
  const [resetId,  setResetId]  = useState<string | null>(null);
  const [resetPwd, setResetPwd] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Delete state
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState(false);

  async function load() {
    const res  = await fetch("/api/admin/portal-accounts");
    const json = await res.json() as { success: boolean; data: MemberRow[] };
    if (json.success) setRows(json.data);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const selectedMember = rows.find((r) => r.memberId === createId);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createId || !createEmail || !createPwd) return;
    setCreating(true); setCreateErr("");
    const res  = await fetch("/api/admin/portal-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: createId, email: createEmail, password: createPwd }),
    });
    const json = await res.json() as { success: boolean; error?: string };
    if (json.success) {
      setCreateId(""); setCreateEmail(""); setCreatePwd("");
      await load();
    } else {
      setCreateErr(json.error ?? "Failed to create account");
    }
    setCreating(false);
  }

  async function handleReset(accountId: string) {
    if (!resetPwd) return;
    setResetting(true);
    await fetch(`/api/admin/portal-accounts/${accountId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPwd }),
    });
    setResetId(null); setResetPwd(""); setShowReset(false);
    setResetting(false);
  }

  async function handleDelete(accountId: string) {
    setDeleting(true);
    await fetch(`/api/admin/portal-accounts/${accountId}`, { method: "DELETE" });
    setDeleteId(null);
    setDeleting(false);
    await load();
  }

  const membersWithoutAccount = rows.filter((r) => !r.account);

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">Loading…</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Portal Accounts</h1>
        <p className="text-sm text-gray-400 mt-0.5">Create and manage member login accounts for the Member Portal.</p>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Plus size={14} /> Create Portal Account</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Member</label>
            <select value={createId} onChange={(e) => {
              setCreateId(e.target.value);
              const m = rows.find((r) => r.memberId === e.target.value);
              if (m && !createEmail) setCreateEmail("");
            }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300">
              <option value="">Select member…</option>
              {membersWithoutAccount.map((r) => (
                <option key={r.memberId} value={r.memberId}>{r.memberName} — {r.area}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Login Email</label>
            <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="member@email.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Initial Password</label>
            <div className="relative">
              <input type={showPwd ? "text" : "password"} value={createPwd} onChange={(e) => setCreatePwd(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {createErr && <p className="text-xs text-red-500">{createErr}</p>}
            <button type="submit" disabled={creating || !createId || !createEmail || !createPwd}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {creating ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
        {selectedMember && (
          <p className="text-xs text-gray-400 mt-2">Creating account for: <span className="font-medium text-gray-600">{selectedMember.memberName}</span></p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">All Members</span>
          <span className="text-xs text-gray-400">{rows.filter((r) => r.account).length} of {rows.length} have portal access</span>
        </div>
        {rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <KeyRound size={24} className="mx-auto mb-2 opacity-30" />
            <p>No members found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Member</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Area</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Portal Access</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Login Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => (
                <tr key={r.memberId} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.memberName}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.area}</td>
                  <td className="px-4 py-3">
                    {r.account
                      ? <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><Check size={10} /> Active</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full"><X size={10} /> None</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.account?.email ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {r.account ? new Date(r.account.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.account && (
                      <div className="flex items-center gap-2 justify-end">
                        {/* Reset password */}
                        {resetId === r.account.id ? (
                          <div className="flex items-center gap-1.5">
                            <div className="relative">
                              <input type={showReset ? "text" : "password"} value={resetPwd} onChange={(e) => setResetPwd(e.target.value)}
                                placeholder="New password" autoFocus
                                className="border border-gray-200 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-indigo-300 pr-7" />
                              <button type="button" onClick={() => setShowReset(!showReset)}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400">
                                {showReset ? <EyeOff size={11} /> : <Eye size={11} />}
                              </button>
                            </div>
                            <button onClick={() => handleReset(r.account!.id)} disabled={resetting || !resetPwd}
                              className="text-xs text-white bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-700 disabled:opacity-50">
                              {resetting ? "…" : "Save"}
                            </button>
                            <button onClick={() => { setResetId(null); setResetPwd(""); }}
                              className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => { setResetId(r.account!.id); setResetPwd(""); }}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 px-2 py-1 border border-gray-200 rounded-lg hover:border-indigo-200 transition-colors">
                            <RefreshCw size={11} /> Reset Pwd
                          </button>
                        )}
                        {/* Delete */}
                        {deleteId === r.account.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-red-600">Delete account?</span>
                            <button onClick={() => handleDelete(r.account!.id)} disabled={deleting}
                              className="text-xs text-white bg-red-500 px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50">
                              {deleting ? "…" : "Yes"}
                            </button>
                            <button onClick={() => setDeleteId(null)} className="text-xs text-gray-400 hover:text-gray-600">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteId(r.account!.id)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 px-2 py-1 border border-gray-100 rounded-lg hover:border-red-200 transition-colors">
                            <Trash2 size={11} /> Remove
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
