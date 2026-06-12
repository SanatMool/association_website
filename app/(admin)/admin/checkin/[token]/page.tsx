"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, User, Ticket, MapPin, Calendar, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RegData {
  id: string; buyerName: string; buyerEmail: string; buyerPhone: string;
  quantity: number; paymentStatus: string; checkedIn: boolean; checkedInAt: string | null; checkedInBy: string | null;
  event: { title: string; date: string; location: string };
  ticketType: { name: string; section: string | null };
}

export default function CheckInPage({ params }: { params: { token: string } }) {
  const [reg, setReg]       = useState<RegData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "done" | "already">("loading");
  const [errorMsg, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetch(`/api/checkin/${params.token}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) { setError(res.error ?? "Invalid QR code"); setStatus("error"); return; }
        setReg(res.data);
        setStatus(res.data.checkedIn ? "already" : "ready");
      })
      .catch(() => { setError("Network error"); setStatus("error"); });
  }, [params.token]);

  async function checkIn() {
    if (!reg) return;
    setChecking(true);
    const res = await fetch(`/api/checkin/${params.token}`, { method: "POST" }).then((r) => r.json()) as { success?: boolean; data?: RegData; error?: string };
    if (res.success) { setReg(res.data ?? reg); setStatus("done"); }
    else { setError(res.error ?? "Check-in failed"); setStatus("error"); }
    setChecking(false);
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-100 p-8 max-w-sm w-full text-center shadow-sm">
          <XCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">Check-in Failed</h1>
          <p className="text-sm text-red-600">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!reg) return null;

  const isAlready = status === "already";
  const isDone    = status === "done";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md max-w-sm w-full overflow-hidden">
        {/* Status banner */}
        <div className={`px-6 py-5 text-center ${isDone ? "bg-emerald-600" : isAlready ? "bg-amber-500" : "bg-[#0a1040]"}`}>
          {isDone    && <CheckCircle size={36} className="text-white mx-auto mb-2" />}
          {isAlready && <AlertTriangle size={36} className="text-white mx-auto mb-2" />}
          {!isDone && !isAlready && <Ticket size={36} className="text-amber-400 mx-auto mb-2" />}
          <h1 className="text-white font-bold text-lg">
            {isDone ? "Checked In!" : isAlready ? "Already Checked In" : "Ready to Check In"}
          </h1>
          {isAlready && reg.checkedInAt && (
            <p className="text-white/70 text-xs mt-1">
              at {new Date(reg.checkedInAt).toLocaleTimeString()} by {reg.checkedInBy}
            </p>
          )}
        </div>

        {/* Attendee details */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{reg.buyerName}</p>
              <p className="text-xs text-gray-400">{reg.buyerEmail}</p>
              <p className="text-xs text-gray-400">{reg.buyerPhone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Ticket size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{reg.ticketType.name}</p>
              <p className="text-xs text-gray-400">Qty: {reg.quantity}</p>
              {reg.ticketType.section && <p className="text-xs text-gray-400">Section: {reg.ticketType.section}</p>}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Calendar size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{reg.event.title}</p>
              <p className="text-xs text-gray-400">{formatDate(reg.event.date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-green-600" />
            </div>
            <p className="text-sm text-gray-700">{reg.event.location}</p>
          </div>

          {/* Payment badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            reg.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}>
            {reg.paymentStatus === "paid" ? "Payment Confirmed" : `Status: ${reg.paymentStatus}`}
          </div>
        </div>

        {/* Check-in button */}
        {!isDone && !isAlready && reg.paymentStatus === "paid" && (
          <div className="px-6 pb-6">
            <button
              onClick={checkIn}
              disabled={checking}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {checking ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              {checking ? "Checking in…" : "Confirm Check-In"}
            </button>
          </div>
        )}
        {!isDone && !isAlready && reg.paymentStatus !== "paid" && (
          <div className="px-6 pb-6">
            <div className="w-full py-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl text-center">
              Cannot check in — payment not confirmed
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
