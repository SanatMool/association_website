"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle, Phone, Share2, BarChart2, AlignLeft, Image, Layout } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: string;
  label: string;
  group: string;
}

const GROUP_CONFIG: { key: string; label: string; icon: React.ElementType }[] = [
  { key: "contact", label: "Contact",  icon: Phone },
  { key: "social",  label: "Social",   icon: Share2 },
  { key: "stats",   label: "Stats",    icon: BarChart2 },
  { key: "footer",  label: "Footer",   icon: AlignLeft },
  { key: "hero",    label: "Hero",     icon: Layout },
  { key: "assets",  label: "Assets",   icon: Image },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values,   setValues]   = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState<Record<string, boolean>>({});
  const [saved,    setSaved]    = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("contact");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Setting[]) => {
        setSettings(data);
        setValues(Object.fromEntries(data.map((s) => [s.key, s.value])));
      });
  }, []);

  async function saveGroup(group: string) {
    setSaving((p) => ({ ...p, [group]: true }));
    const groupSettings = settings.filter((s) => s.group === group);
    await Promise.all(
      groupSettings.map((s) =>
        fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: s.key, value: values[s.key] ?? s.value }),
        })
      )
    );
    setSaving((p) => ({ ...p, [group]: false }));
    setSaved((p) => ({ ...p, [group]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [group]: false })), 2500);
  }

  const rows = settings.filter((s) => s.group === activeTab);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Site Settings</h1>
        <p className="text-gray-500 text-sm">
          Edit contact information, social links, and other content shown on the public website.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 border-b border-gray-100 mb-6">
        {GROUP_CONFIG.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? "border-[#0a1040] text-[#0a1040]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {rows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              {GROUP_CONFIG.find((g) => g.key === activeTab)?.label} Settings
            </h2>
            <button
              onClick={() => saveGroup(activeTab)}
              disabled={saving[activeTab]}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#0a1040] text-white hover:bg-[#0d1550] transition-colors disabled:opacity-50"
            >
              {saved[activeTab] ? (
                <><CheckCircle size={14} className="text-green-400" /> Saved</>
              ) : (
                <><Save size={14} /> {saving[activeTab] ? "Saving…" : "Save changes"}</>
              )}
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {rows.map((s) => (
              <div key={s.key} className="px-6 py-4 flex items-start gap-4">
                <label className="w-52 text-sm font-medium text-gray-700 pt-2 flex-shrink-0">
                  {s.label}
                </label>
                <div className="flex-1">
                  {(values[s.key] ?? "").length > 80 || s.key.includes("tagline") || s.key.includes("address") ? (
                    <textarea
                      value={values[s.key] ?? ""}
                      onChange={(e) => setValues((p) => ({ ...p, [s.key]: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    />
                  ) : (
                    <input
                      type={s.key.includes("map_url") || s.key.includes("social") ? "url" : "text"}
                      value={values[s.key] ?? ""}
                      onChange={(e) => setValues((p) => ({ ...p, [s.key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  )}
                  <p className="text-xs text-gray-400 mt-1 font-mono">{s.key}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
