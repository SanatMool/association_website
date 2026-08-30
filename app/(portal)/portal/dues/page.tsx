"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, CreditCard, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import PanelCard from "@/components/ui/panel/PanelCard";
import { PanelTable, PanelTableHead, PanelTableRow } from "@/components/ui/panel/PanelTable";
import Badge from "@/components/ui/panel/Badge";
import EmptyState from "@/components/ui/panel/EmptyState";

interface Payment {
  id: string; type: string; amount: string; dueAmount: string | null;
  periodStart: string; periodEnd: string;
  method: string; status: string; receiptNumber: string | null; paidAt: string | null;
  memberCategory: { name: string } | null;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function DuesStatusBadge({ status }: { status: string }) {
  if (status === "paid") return <Badge tone="success" icon={<CheckCircle size={11} />}>Paid</Badge>;
  if (status === "partial") return <Badge tone="warning" icon={<Clock size={11} />}>Partial</Badge>;
  return <Badge tone="warning" icon={<Clock size={11} />}>Pending</Badge>;
}

function periodLabel(p: Payment) {
  const d = new Date(p.periodStart);
  if (p.type === "annual_renewal") return `${d.getFullYear()}`;
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function PortalDuesPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [loadError, setLoadError] = useState("");

  function load() {
    setLoading(true);
    setLoadError("");
    fetch("/api/portal/dues")
      .then((r) => r.json())
      .then((json: { success: boolean; data: Payment[] }) => {
        if (!json.success) throw new Error();
        setPayments(json.data);
      })
      .catch(() => setLoadError("Couldn't load your dues. Check your connection and try again."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const paid    = payments.filter((p) => p.status === "paid");
  const partial = payments.filter((p) => p.status === "partial");
  const pending = payments.filter((p) => p.status === "pending");

  const totalPaid = paid.reduce((s, p) => s + Number(p.amount), 0);
  // Outstanding = fully unpaid pending amounts + remaining balance on partial records
  const totalOutstanding =
    pending.reduce((s, p) => s + (p.dueAmount ? Number(p.dueAmount) : Number(p.amount)), 0) +
    partial.reduce((s, p) => s + (p.dueAmount ? Number(p.dueAmount) - Number(p.amount) : 0), 0);
  const hasOutstanding = totalOutstanding > 0;

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">Loading…</div>;

  if (loadError) return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <AlertCircle size={24} className="text-amber-300" />
      <p className="text-sm text-gray-500">{loadError}</p>
      <button
        onClick={load}
        className="px-3 py-1.5 text-xs font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Dues</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your membership fee payment history.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <PanelCard className="p-4" hover={false}>
          <div className="text-xl font-bold text-gray-900">{payments.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">Total Records</div>
        </PanelCard>
        <div className="bg-green-50 rounded-2xl border border-green-100 p-4">
          <div className="text-xl font-bold text-green-700">Rs {totalPaid.toLocaleString()}</div>
          <div className="text-xs text-green-600 mt-0.5">{paid.length} paid</div>
        </div>
        <div className={`${hasOutstanding ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"} rounded-2xl border p-4`}>
          <div className={`text-xl font-bold ${hasOutstanding ? "text-amber-700" : "text-gray-400"}`}>
            Rs {totalOutstanding.toLocaleString()}
          </div>
          <div className={`text-xs mt-0.5 ${hasOutstanding ? "text-amber-600" : "text-gray-400"}`}>
            {pending.length + partial.length > 0
              ? `${pending.length} pending${partial.length > 0 ? `, ${partial.length} partial` : ""}`
              : "No outstanding dues"}
          </div>
        </div>
      </div>

      {/* Partial payment alert */}
      {partial.length > 0 && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertCircle size={16} className="text-orange-500 mt-0.5 shrink-0" />
          <p className="text-sm text-orange-700">
            You have {partial.length} partially paid {partial.length === 1 ? "record" : "records"}.
            Please contact the association to settle the remaining balance.
          </p>
        </div>
      )}

      {payments.length === 0 ? (
        <PanelCard className="text-center py-16" hover={false}>
          <EmptyState icon={CreditCard} title="No payment records yet." />
        </PanelCard>
      ) : (
        <>
          {/* Desktop table */}
          <PanelTable className="hidden md:block">
            <table className="w-full text-sm">
              <PanelTableHead>
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Period</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Bill / Paid</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Paid On</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Receipt</th>
                </tr>
              </PanelTableHead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p, i) => {
                  const dueAmt  = p.dueAmount ? Number(p.dueAmount) : null;
                  const paidAmt = Number(p.amount);
                  const remaining = dueAmt && p.status === "partial" ? dueAmt - paidAmt : 0;
                  return (
                    <PanelTableRow key={p.id} index={i}>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.type === "monthly" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                          {p.type === "monthly" ? "Monthly" : "Annual"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">{periodLabel(p)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.memberCategory?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {dueAmt ? (
                          <div className="leading-tight">
                            <div className="text-[10px] text-gray-400">
                              Bill: <span className="font-semibold text-gray-600">Rs {dueAmt.toLocaleString()}</span>
                            </div>
                            <div className="text-xs font-bold text-gray-900">
                              Paid: Rs {paidAmt.toLocaleString()}
                            </div>
                            {remaining > 0 && (
                              <div className="text-[10px] text-orange-600 font-medium">
                                Rs {remaining.toLocaleString()} remaining
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">Rs {paidAmt.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><DuesStatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-400">{p.paidAt ? formatDate(p.paidAt) : "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{p.receiptNumber ?? "—"}</td>
                    </PanelTableRow>
                  );
                })}
              </tbody>
            </table>
          </PanelTable>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {payments.map((p) => {
              const dueAmt    = p.dueAmount ? Number(p.dueAmount) : null;
              const paidAmt   = Number(p.amount);
              const remaining = dueAmt && p.status === "partial" ? dueAmt - paidAmt : 0;
              return (
                <PanelCard key={p.id} className="p-4 space-y-2" hover={false}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.type === "monthly" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                        {p.type === "monthly" ? "Monthly" : "Annual"}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{periodLabel(p)}</span>
                    </div>
                    <DuesStatusBadge status={p.status} />
                  </div>
                  {p.memberCategory && (
                    <div className="text-xs text-gray-400">{p.memberCategory.name}</div>
                  )}
                  <div className="flex items-end justify-between pt-1 border-t border-gray-50">
                    <div>
                      {dueAmt ? (
                        <div className="leading-snug">
                          <div className="text-[11px] text-gray-400">Bill: <span className="font-semibold text-gray-600">Rs {dueAmt.toLocaleString()}</span></div>
                          <div className="text-sm font-bold text-gray-900">Paid: Rs {paidAmt.toLocaleString()}</div>
                          {remaining > 0 && <div className="text-[11px] text-orange-600 font-medium">Rs {remaining.toLocaleString()} remaining</div>}
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-gray-900">Rs {paidAmt.toLocaleString()}</div>
                      )}
                    </div>
                    <div className="text-right">
                      {p.paidAt && <div className="text-xs text-gray-400">{formatDate(p.paidAt)}</div>}
                      {p.receiptNumber && <div className="text-xs text-gray-400">#{p.receiptNumber}</div>}
                    </div>
                  </div>
                </PanelCard>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
