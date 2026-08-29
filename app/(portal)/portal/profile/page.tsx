"use client";

import { useEffect, useState } from "react";
import { User, Phone, Mail, MapPin, Tag, Calendar, Plus, X, Save, CheckCircle } from "lucide-react";

interface ProfileData {
  user:        { name: string; email: string };
  member:      { id: string; name: string; nameNe: string | null; area: string; image: string | null; phones: string[]; phone: string | null; email: string | null; memberSince: string | null };
  association: { name: string; logo: string | null };
  category:    string | null;
}

export default function PortalProfilePage() {
  const [data,    setData]    = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Editable fields
  const [phones, setPhones] = useState<string[]>([]);
  const [email,  setEmail]  = useState("");
  const [dirty,  setDirty]  = useState(false);

  useEffect(() => {
    fetch("/api/portal/me")
      .then((r) => r.json())
      .then((res: { success: boolean; data: ProfileData }) => {
        if (!res.success) return;
        const d = res.data;
        setData(d);
        const resolved = d.member.phones.length > 0
          ? d.member.phones
          : d.member.phone ? d.member.phone.split(",").map((p) => p.trim()).filter(Boolean) : [];
        setPhones(resolved.length > 0 ? resolved : [""]);
        setEmail(d.member.email ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function addPhone() { setPhones((p) => [...p, ""]); setDirty(true); }
  function removePhone(i: number) { setPhones((p) => p.filter((_, idx) => idx !== i)); setDirty(true); }
  function updatePhone(i: number, val: string) {
    setPhones((p) => { const n = [...p]; n[i] = val; return n; });
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/portal/me", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ phones: phones.filter(Boolean), email }),
    });
    const json = await res.json() as { success: boolean; error?: string };
    setSaving(false);
    if (!json.success) { setError(json.error ?? "Failed to save"); return; }
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#0a1040] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-400 text-sm">Could not load profile.</div>;
  }

  const { member, association, category } = data;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User size={20} className="text-indigo-500" />
          My Profile
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{association.name}</p>
      </div>

      {/* Read-only identity */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Member Information</h2>
          <p className="text-xs text-gray-400 mt-0.5">Contact your association admin to update your name or area.</p>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1">
              <User size={12} /> Name
            </div>
            <div className="text-sm font-semibold text-gray-900">{member.name}</div>
            {member.nameNe && <div className="text-xs text-gray-400 mt-0.5">{member.nameNe}</div>}
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1">
              <MapPin size={12} /> Area
            </div>
            <div className="text-sm text-gray-700">{member.area}</div>
          </div>
          {category && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1">
                <Tag size={12} /> Membership Category
              </div>
              <div className="text-sm text-gray-700">{category}</div>
            </div>
          )}
          {member.memberSince && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1">
                <Calendar size={12} /> Member Since
              </div>
              <div className="text-sm text-gray-700">{member.memberSince}</div>
            </div>
          )}
        </div>
      </div>

      {/* Editable contact */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Contact Details</h2>
          <p className="text-xs text-gray-400 mt-0.5">You can update your phone numbers and email address.</p>
        </div>
        <div className="p-5 space-y-5">
          {/* Phones */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Phone size={12} /> Phone Numbers
              </label>
              <button onClick={addPhone}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                <Plus size={12} /> Add phone
              </button>
            </div>
            <div className="space-y-2">
              {phones.map((ph, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={ph}
                    onChange={(e) => updatePhone(i, e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  {phones.length > 1 && (
                    <button onClick={() => removePhone(i)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
              <Mail size={12} /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setDirty(true); }}
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      {error && (
        <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="mb-3 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={14} /> Contact details saved successfully.
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={saving || !dirty}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#0a1040] text-white text-sm font-medium rounded-lg hover:bg-[#0d1550] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save size={14} />
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
