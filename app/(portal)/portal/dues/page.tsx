"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, CreditCard } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Payment {
  id: string; type: string; amount: string; periodStart: string; periodEnd: string;
  method: string; status: string; receiptNumber: string | null; paidAt: string | null;
  memberCategory: { name: string } | null;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function periodLabel(p: Payment) {
  const d = new Date(p.periodStart);
  if (p.type === "annual_renewal") return `${d.getFullYear()}`;
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function PortalDuesPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch("/api/portal/dues").then((r) => r.json()).then((json: { success: boolean; data: Payment[] }) => {
      if (json.success) setPayments(json.data);
      setLoading(false);
    });
  }, []);

  const paid    = payments.filter((p) => p.status === "paid");
  const pending = payments.filter((p) => p.status === "pending");
  const totalPaid    = paid.reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = pending.reduce((s, p) => s + Number(p.amount), 0);

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">Loading…</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Dues</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your membership fee payment history.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xl font-bold text-gray-900">{payments.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">Total Records</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4">
          <div className="text-xl font-bold text-green-700">Rs {totalPaid.toLocaleString()}</div>
          <div className="text-xs text-green-600 mt-0.5">{paid.length} payments made</div>
        </div>
        <div className={`${totalPending > 0 ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"} rounded-xl border p-4`}>
          <div className={`text-xl font-bold ${totalPending > 0 ? "text-amber-700" : "text-gray-400"}`}>Rs {totalPending.toLocaleString()}</div>
          <div className={`text-xs mt-0.5 ${totalPending > 0 ? "text-amber-600" : "text-gray-400"}`}>{pending.length} pending</div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 text-center py-16 text-gray-400">
          <CreditCard size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No payment records yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Period</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Paid On</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.type === "monthly" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                      {p.type === "monthly" ? "Monthly" : "Annual"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">{periodLabel(p)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.memberCategory?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">Rs {Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {p.status === "paid"
                      ? <span className="inline-flex items-center gap-1 text-xs text-green-700"><CheckCircle size={11} />Paid</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-amber-600"><Clock size={11} />Pending</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{p.paidAt ? formatDate(p.paidAt) : "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{p.receiptNumber ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
