"use client";

import { useState } from "react";
import { Ticket, Users, Check, X } from "lucide-react";

interface TicketType {
  id: string; name: string; description: string | null; section: string | null;
  price: string; memberPrice: string | null;
  totalCapacity: number | null; strictCapacity: boolean; soldCount: number; active: boolean;
}

export default function TicketSection({ eventId, ticketTypes }: { eventId: string; ticketTypes: TicketType[] }) {
  const activeTypes = ticketTypes.filter((t) => t.active);
  const [selected, setSelected] = useState(activeTypes[0]?.id ?? "");
  const [qty, setQty]           = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");

  if (activeTypes.length === 0) return null;

  const selectedType = activeTypes.find((t) => t.id === selected);
  const isSoldOut = selectedType?.strictCapacity && selectedType.totalCapacity !== null
    ? selectedType.soldCount >= selectedType.totalCapacity
    : false;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) { setError("All fields are required."); return; }
    setSubmitting(true); setError("");
    const res = await fetch(`/api/events/${eventId}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketTypeId: selected,
        quantity: qty,
        buyerName: form.name,
        buyerEmail: form.email,
        buyerPhone: form.phone,
        notes: form.notes,
      }),
    }).then((r) => r.json()) as { success?: boolean; error?: string };
    if (res.success) { setDone(true); }
    else setError(res.error ?? "Registration failed. Please try again.");
    setSubmitting(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
        <Ticket size={14} className="text-gold-500" /> Tickets
      </h3>

      {done ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check size={22} className="text-emerald-600" />
          </div>
          <p className="font-semibold text-gray-900 text-sm">Registration Received!</p>
          <p className="text-xs text-gray-400 mt-1">We'll contact you with payment details and confirmation.</p>
        </div>
      ) : showForm ? (
        <form onSubmit={submit} className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 mb-1">
            <span className="font-semibold">{selectedType?.name}</span>
            {selectedType?.section && <span className="text-gray-400 ml-1">· {selectedType.section}</span>}
            <span className="ml-2 text-gray-800 font-semibold">Rs. {Number(selectedType?.price ?? 0).toLocaleString()}</span>
            <span className="text-gray-400 ml-1">× {qty}</span>
          </div>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Your name *" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30" />
          <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email address *" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30" />
          <input required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Phone number *" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30" />
          <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Any special requests (optional)" rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 resize-none" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors disabled:opacity-60">
              {submitting ? "Registering…" : "Submit Registration"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50">
              <X size={16} />
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Ticket type selector */}
          <div className="space-y-2">
            {activeTypes.map((t) => {
              const soldOut = t.strictCapacity && t.totalCapacity !== null && t.soldCount >= t.totalCapacity;
              return (
                <button key={t.id} onClick={() => { if (!soldOut) setSelected(t.id); }}
                  disabled={soldOut}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    selected === t.id ? "border-gold-400 bg-gold-50" : "border-gray-100 hover:border-gray-200"
                  } ${soldOut ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                      {t.section && <p className="text-xs text-gray-400">{t.section}</p>}
                      {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-bold text-gray-900 text-sm">Rs. {Number(t.price).toLocaleString()}</p>
                      {t.memberPrice && (
                        <p className="text-xs text-emerald-600">Members: Rs. {Number(t.memberPrice).toLocaleString()}</p>
                      )}
                      {t.totalCapacity !== null && (
                        <p className="text-xs text-gray-400 flex items-center gap-0.5 justify-end mt-0.5">
                          <Users size={10} /> {t.totalCapacity - t.soldCount} left
                        </p>
                      )}
                      {soldOut && <p className="text-xs text-red-500 font-medium">Sold out</p>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quantity */}
          {selectedType && !isSoldOut && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-medium">Quantity</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold flex items-center justify-center">−</button>
                <span className="w-6 text-center text-sm font-semibold text-gray-800">{qty}</span>
                <button onClick={() => setQty((q) => {
                  if (selectedType.strictCapacity && selectedType.totalCapacity !== null) {
                    return Math.min(q + 1, selectedType.totalCapacity - selectedType.soldCount);
                  }
                  return q + 1;
                })}
                  className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold flex items-center justify-center">+</button>
              </div>
              <span className="ml-auto text-sm font-bold text-gray-900">
                Rs. {(Number(selectedType.price) * qty).toLocaleString()}
              </span>
            </div>
          )}

          <button onClick={() => setShowForm(true)} disabled={isSoldOut || !selectedType}
            className="w-full py-3 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors disabled:opacity-40">
            Register Interest
          </button>
          <p className="text-[11px] text-gray-400 text-center">
            No payment now — our team will contact you to confirm.
          </p>
        </>
      )}
    </div>
  );
}
