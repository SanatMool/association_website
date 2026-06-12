"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Check, X, Ticket, Users, Tag, DollarSign,
  CheckCircle, XCircle, AlertTriangle, ChevronDown, RefreshCw,
} from "lucide-react";

interface TicketType {
  id: string; name: string; description: string | null; section: string | null;
  price: string; memberPrice: string | null; totalCapacity: number | null;
  strictCapacity: boolean; soldCount: number; order: number; active: boolean;
}
interface Registration {
  id: string; buyerName: string; buyerEmail: string; buyerPhone: string;
  quantity: number; paymentStatus: string; notes: string | null;
  amount: string | null; paymentMethod: string | null; receiptNumber: string | null;
  cancelReason: string | null; checkedIn: boolean; checkedInAt: string | null;
  createdAt: string;
  ticketType: { id: string; name: string; section: string | null };
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  paid:      "bg-emerald-100 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
  refunded:  "bg-blue-100 text-blue-700",
};

const PAYMENT_METHODS = ["cash", "bank_transfer", "cheque", "other"];

export default function EventTicketsClient({ eventId }: { eventId: string }) {
  const [tab, setTab] = useState<"types" | "registrations">("types");
  const [types, setTypes]     = useState<TicketType[]>([]);
  const [regs, setRegs]       = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [regFilter, setRegFilter] = useState("");

  // Type form state
  const [showTypeForm, setShowTypeForm]   = useState(false);
  const [editType, setEditType]           = useState<TicketType | null>(null);
  const [typeForm, setTypeForm] = useState({ name: "", description: "", section: "", price: "0", memberPrice: "", totalCapacity: "", strictCapacity: false });
  const [typeSaving, setTypeSaving] = useState(false);
  const [typeError, setTypeError]   = useState("");

  // Action modal state
  const [actionReg, setActionReg]     = useState<Registration | null>(null);
  const [actionType, setActionType]   = useState<"confirm_payment" | "cancel" | "refund" | null>(null);
  const [actionForm, setActionForm]   = useState({ paymentMethod: "cash", receiptNumber: "", amount: "", cancelReason: "", refundAmount: "" });
  const [actionSaving, setActionSaving] = useState(false);
  const [actionError, setActionError]   = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const loadTypes = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/ticket-types`).then((r) => r.json()) as { success: boolean; data: TicketType[] };
    if (res.success) setTypes(res.data);
  }, [eventId]);

  const loadRegs = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/registrations`).then((r) => r.json()) as { success: boolean; data: Registration[] };
    if (res.success) setRegs(res.data);
  }, [eventId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTypes(), loadRegs()]).then(() => setLoading(false));
  }, [loadTypes, loadRegs]);

  function openTypeForm(t?: TicketType) {
    setEditType(t ?? null);
    setTypeForm(t ? {
      name: t.name, description: t.description ?? "", section: t.section ?? "",
      price: String(t.price), memberPrice: t.memberPrice ? String(t.memberPrice) : "",
      totalCapacity: t.totalCapacity ? String(t.totalCapacity) : "",
      strictCapacity: t.strictCapacity,
    } : { name: "", description: "", section: "", price: "0", memberPrice: "", totalCapacity: "", strictCapacity: false });
    setTypeError("");
    setShowTypeForm(true);
  }

  async function saveType() {
    if (!typeForm.name.trim()) { setTypeError("Name is required"); return; }
    setTypeSaving(true); setTypeError("");
    const payload = {
      name:          typeForm.name.trim(),
      description:   typeForm.description.trim() || null,
      section:       typeForm.section.trim() || null,
      price:         parseFloat(typeForm.price) || 0,
      memberPrice:   typeForm.memberPrice ? parseFloat(typeForm.memberPrice) : null,
      totalCapacity: typeForm.totalCapacity ? parseInt(typeForm.totalCapacity) : null,
      strictCapacity: typeForm.strictCapacity,
    };
    const url = editType ? `/api/events/${eventId}/ticket-types/${editType.id}` : `/api/events/${eventId}/ticket-types`;
    const method = editType ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json()) as { success?: boolean; error?: string };
    if (res.success) { await loadTypes(); setShowTypeForm(false); }
    else setTypeError(res.error ?? "Failed to save");
    setTypeSaving(false);
  }

  async function toggleActive(t: TicketType) {
    await fetch(`/api/events/${eventId}/ticket-types/${t.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !t.active }),
    });
    await loadTypes();
  }

  async function deleteType(id: string) {
    const res = await fetch(`/api/events/${eventId}/ticket-types/${id}`, { method: "DELETE" }).then((r) => r.json()) as { error?: string };
    if (res.error) { alert(res.error); return; }
    await loadTypes();
  }

  async function submitAction() {
    if (!actionReg || !actionType) return;
    setActionSaving(true); setActionError("");
    const payload: Record<string, unknown> = { action: actionType };
    if (actionType === "confirm_payment") {
      payload.paymentMethod  = actionForm.paymentMethod;
      payload.receiptNumber  = actionForm.receiptNumber || null;
      payload.amount         = actionForm.amount ? parseFloat(actionForm.amount) : undefined;
    } else if (actionType === "cancel") {
      payload.cancelReason = actionForm.cancelReason || null;
    } else if (actionType === "refund") {
      payload.refundAmount = actionForm.refundAmount ? parseFloat(actionForm.refundAmount) : undefined;
    }
    const res = await fetch(`/api/events/${eventId}/registrations/${actionReg.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    }).then((r) => r.json()) as { success?: boolean; error?: string };
    if (res.success) { await loadRegs(); setActionReg(null); setActionType(null); }
    else setActionError(res.error ?? "Action failed");
    setActionSaving(false);
  }

  async function deleteReg(id: string) {
    const res = await fetch(`/api/events/${eventId}/registrations/${id}`, { method: "DELETE" }).then((r) => r.json()) as { error?: string };
    if (res.error) { alert(res.error); }
    else { await loadRegs(); }
    setConfirmDeleteId(null);
  }

  const filteredRegs = regs.filter((r) =>
    !regFilter || r.paymentStatus === regFilter
  );

  if (loading) return (
    <div className="py-10 text-center text-gray-400 text-sm">Loading tickets…</div>
  );

  return (
    <div>
      {/* Subtab bar */}
      <div className="flex gap-1 border-b border-gray-100 mb-5">
        {(["types", "registrations"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t ? "text-[#0a1040] border-b-2 border-[#0a1040] -mb-px bg-white" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t === "types" ? (
              <span className="flex items-center gap-1.5"><Tag size={13} /> Ticket Types {types.length > 0 && `(${types.length})`}</span>
            ) : (
              <span className="flex items-center gap-1.5"><Users size={13} /> Registrations {regs.length > 0 && `(${regs.length})`}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── TICKET TYPES TAB ── */}
      {tab === "types" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Define ticket categories, prices and capacity for this event.</p>
            <button onClick={() => openTypeForm()}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0a1040] text-white text-xs font-semibold rounded-lg hover:bg-[#0d1550] transition-colors">
              <Plus size={13} /> Add Ticket Type
            </button>
          </div>

          {types.length === 0 && !showTypeForm ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <Ticket size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No ticket types yet.</p>
              <button onClick={() => openTypeForm()} className="mt-3 text-xs text-amber-600 hover:text-amber-700 font-medium">Add the first one →</button>
            </div>
          ) : (
            <div className="space-y-2">
              {types.map((t) => (
                <div key={t.id} className={`bg-white border rounded-xl px-4 py-3 flex items-start gap-3 ${!t.active ? "opacity-50" : "border-gray-100"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 text-sm">{t.name}</span>
                      {t.section && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{t.section}</span>}
                      {!t.active && <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Inactive</span>}
                    </div>
                    {t.description && <p className="text-xs text-gray-400 mb-1">{t.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><DollarSign size={11} /> Rs. {Number(t.price).toLocaleString()}</span>
                      {t.memberPrice && <span className="text-emerald-600">Member: Rs. {Number(t.memberPrice).toLocaleString()}</span>}
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {t.soldCount} sold
                        {t.totalCapacity !== null ? ` / ${t.totalCapacity}` : ""}
                        {t.strictCapacity && <span className="ml-1 text-orange-500">(strict)</span>}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => openTypeForm(t)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => toggleActive(t)} title={t.active ? "Deactivate" : "Activate"}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50">
                      {t.active ? <XCircle size={13} /> : <CheckCircle size={13} />}
                    </button>
                    {t.soldCount === 0 && (
                      <button onClick={() => deleteType(t.id)} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Type form inline */}
          {showTypeForm && (
            <div className="mt-4 bg-white border border-indigo-100 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">{editType ? "Edit Ticket Type" : "New Ticket Type"}</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Name *</label>
                  <input value={typeForm.name} onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    placeholder="e.g. VIP, General, Table" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Section / Zone</label>
                  <input value={typeForm.section} onChange={(e) => setTypeForm((f) => ({ ...f, section: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    placeholder="e.g. Banquet Hall A" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Price (Rs.)</label>
                  <input type="number" min="0" value={typeForm.price} onChange={(e) => setTypeForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Member Price (Rs.) <span className="text-gray-300">optional</span></label>
                  <input type="number" min="0" value={typeForm.memberPrice} onChange={(e) => setTypeForm((f) => ({ ...f, memberPrice: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300" placeholder="Leave blank to use regular price" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Capacity <span className="text-gray-300">optional</span></label>
                  <input type="number" min="1" value={typeForm.totalCapacity} onChange={(e) => setTypeForm((f) => ({ ...f, totalCapacity: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300" placeholder="Leave blank = unlimited" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="strict" checked={typeForm.strictCapacity} onChange={(e) => setTypeForm((f) => ({ ...f, strictCapacity: e.target.checked }))}
                    className="rounded border-gray-300 text-indigo-600" />
                  <label htmlFor="strict" className="text-sm text-gray-700 cursor-pointer">Strict capacity (block at limit)</label>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Description <span className="text-gray-300">optional</span></label>
                  <input value={typeForm.description} onChange={(e) => setTypeForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    placeholder="What's included, seating info, etc." />
                </div>
              </div>
              {typeError && <p className="text-xs text-red-500 mt-2">{typeError}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={saveType} disabled={typeSaving}
                  className="px-4 py-2 bg-[#0a1040] text-white text-xs font-semibold rounded-lg hover:bg-[#0d1550] disabled:opacity-60 transition-colors">
                  {typeSaving ? "Saving…" : editType ? "Save Changes" : "Add Ticket Type"}
                </button>
                <button onClick={() => setShowTypeForm(false)} className="px-4 py-2 text-gray-500 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── REGISTRATIONS TAB ── */}
      {tab === "registrations" && (
        <div>
          {/* Stats */}
          <div className="flex flex-wrap gap-3 mb-4">
            {["", "pending", "paid", "cancelled", "refunded"].map((s) => {
              const count = s ? regs.filter((r) => r.paymentStatus === s).length : regs.length;
              return (
                <button key={s} onClick={() => setRegFilter(s)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                    regFilter === s ? "bg-[#0a1040] text-white border-[#0a1040]" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}>
                  {s || "All"} ({count})
                </button>
              );
            })}
            <button onClick={() => { void loadRegs(); }} className="ml-auto text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <RefreshCw size={11} /> Refresh
            </button>
          </div>

          {filteredRegs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 py-12 text-center">
              <Users size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No registrations yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRegs.map((r) => (
                <div key={r.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-gray-900 text-sm">{r.buyerName}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_COLORS[r.paymentStatus] ?? "bg-gray-100 text-gray-500"}`}>
                          {r.paymentStatus}
                        </span>
                        {r.checkedIn && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                            <Check size={9} /> Checked in
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{r.buyerEmail} · {r.buyerPhone}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                        <span><Ticket size={10} className="inline mr-1" />{r.ticketType.name} × {r.quantity}</span>
                        {r.ticketType.section && <span>{r.ticketType.section}</span>}
                        {r.amount && <span>Rs. {Number(r.amount).toLocaleString()}</span>}
                        {r.notes && <span className="text-gray-400 italic">"{r.notes}"</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {r.paymentStatus === "pending" && (
                        <button onClick={() => { setActionReg(r); setActionType("confirm_payment"); setActionForm((f) => ({ ...f, amount: r.amount ? String(r.amount) : "" })); setActionError(""); }}
                          className="text-xs px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
                          Confirm Payment
                        </button>
                      )}
                      {(r.paymentStatus === "pending" || r.paymentStatus === "paid") && (
                        <div className="relative">
                          <button onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50">
                            <ChevronDown size={13} />
                          </button>
                          {openMenuId === r.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 min-w-[140px] py-1">
                                {r.paymentStatus === "paid" && (
                                  <button onClick={() => { setActionReg(r); setActionType("refund"); setActionForm((f) => ({ ...f, refundAmount: r.amount ? String(r.amount) : "" })); setActionError(""); setOpenMenuId(null); }}
                                    className="w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-1.5">
                                    <RefreshCw size={11} /> Refund
                                  </button>
                                )}
                                <button onClick={() => { setActionReg(r); setActionType("cancel"); setActionError(""); setOpenMenuId(null); }}
                                  className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 flex items-center gap-1.5">
                                  <XCircle size={11} /> Cancel
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {(r.paymentStatus === "cancelled" || r.paymentStatus === "pending") && (
                        confirmDeleteId === r.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => deleteReg(r.id)} className="text-[10px] px-2 py-1 bg-red-600 text-white rounded font-medium">Delete</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] px-2 py-1 border border-gray-200 rounded text-gray-500">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(r.id)} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                            <Trash2 size={13} />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ACTION MODAL ── */}
      {actionReg && actionType && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="font-bold text-gray-900 mb-1">
              {actionType === "confirm_payment" ? "Confirm Payment" : actionType === "cancel" ? "Cancel Registration" : "Issue Refund"}
            </h3>
            <p className="text-xs text-gray-400 mb-4">{actionReg.buyerName} — {actionReg.ticketType.name} × {actionReg.quantity}</p>

            {actionType === "confirm_payment" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Payment Method</label>
                  <select value={actionForm.paymentMethod} onChange={(e) => setActionForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300">
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Amount Received (Rs.)</label>
                  <input type="number" value={actionForm.amount} onChange={(e) => setActionForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Receipt Number <span className="text-gray-300">optional</span></label>
                  <input value={actionForm.receiptNumber} onChange={(e) => setActionForm((f) => ({ ...f, receiptNumber: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300" placeholder="e.g. RCT-001" />
                </div>
              </div>
            )}
            {actionType === "cancel" && (
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Reason <span className="text-gray-300">optional</span></label>
                <input value={actionForm.cancelReason} onChange={(e) => setActionForm((f) => ({ ...f, cancelReason: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300" placeholder="Reason for cancellation" />
              </div>
            )}
            {actionType === "refund" && (
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Refund Amount (Rs.)</label>
                <input type="number" value={actionForm.refundAmount} onChange={(e) => setActionForm((f) => ({ ...f, refundAmount: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300" />
              </div>
            )}

            {actionError && <p className="text-xs text-red-500 mt-2">{actionError}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={submitAction} disabled={actionSaving}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-colors disabled:opacity-60 ${
                  actionType === "confirm_payment" ? "bg-emerald-600 hover:bg-emerald-700" :
                  actionType === "refund" ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
                }`}>
                {actionSaving ? "Processing…" : actionType === "confirm_payment" ? "Confirm" : actionType === "refund" ? "Issue Refund" : "Cancel Registration"}
              </button>
              <button onClick={() => { setActionReg(null); setActionType(null); }}
                className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
