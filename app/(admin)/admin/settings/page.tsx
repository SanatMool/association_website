"use client";

import { useEffect, useState } from "react";
import {
  Save, CheckCircle, Phone, Share2, BarChart2, AlignLeft,
  Image as ImageIcon, Layout, Settings,
} from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: string;
  label: string;
  group: string;
}

const GROUP_CONFIG: { key: string; label: string; icon: React.ElementType; description: string }[] = [
  { key: "contact", label: "Contact",  icon: Phone,      description: "Phone, email, address, and map URL shown on the public contact section." },
  { key: "social",  label: "Social",   icon: Share2,     description: "Facebook, Instagram, YouTube and other social media links." },
  { key: "stats",   label: "Stats",    icon: BarChart2,  description: "Statistics shown on the public homepage (member count, years active, etc.)." },
  { key: "footer",  label: "Footer",   icon: AlignLeft,  description: "Footer text, copyright, and links shown at the bottom of the public site." },
  { key: "hero",    label: "Hero",     icon: Layout,     description: "Homepage hero section: headline, tagline, and call-to-action text." },
  { key: "assets",  label: "Assets",   icon: ImageIcon,  description: "Logo URLs, favicon, and other asset references used across the site." },
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
  const activeGroup = GROUP_CONFIG.find((g) => g.key === activeTab);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <Settings size={22} className="text-[#0a1040]" />
          Site Settings
        </h1>
        <p className="text-gray-500 text-sm">
          Edit contact information, social links, and other content shown on the public website.
        </p>
      </div>

      {/* Tab bar — scrollable on mobile */}
      <div className="overflow-x-auto -mx-1 px-1 mb-6">
        <div className="flex gap-0.5 border-b border-gray-100 min-w-max">
          {GROUP_CONFIG.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
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
      </div>

      {/* Tab content */}
      {rows.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">{activeGroup?.label} Settings</h2>
              {activeGroup?.description && (
                <p className="text-xs text-gray-400 mt-0.5">{activeGroup.description}</p>
              )}
            </div>
            <button
              onClick={() => saveGroup(activeTab)}
              disabled={saving[activeTab]}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-[#0a1040] text-white hover:bg-[#0d1550] transition-colors disabled:opacity-50 min-h-[40px] w-full sm:w-auto justify-center"
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
              <div key={s.key} className="px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                <label className="sm:w-52 text-sm font-medium text-gray-700 sm:pt-2 flex-shrink-0">
                  {s.label}
                  <p className="text-xs text-gray-300 font-mono font-normal mt-0.5">{s.key}</p>
                </label>
                <div className="flex-1">
                  {(values[s.key] ?? "").length > 80 || s.key.includes("tagline") || s.key.includes("address") || s.key.includes("description") || s.key.includes("bio") ? (
                    <textarea
                      value={values[s.key] ?? ""}
                      onChange={(e) => setValues((p) => ({ ...p, [s.key]: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    />
                  ) : (
                    <input
                      type={s.key.includes("url") || s.key.includes("social") || s.key.includes("http") ? "url" : "text"}
                      value={values[s.key] ?? ""}
                      onChange={(e) => setValues((p) => ({ ...p, [s.key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          {activeGroup && (
            <activeGroup.icon size={32} className="text-gray-200 mx-auto mb-3" />
          )}
          <p className="text-gray-500 text-sm font-medium">{activeGroup?.label} settings not configured yet.</p>
          <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">{activeGroup?.description}</p>
          <p className="text-gray-300 text-xs mt-4">
            No settings found for this group. Add them via seed or the API.
          </p>
        </div>
      )}
    </div>
  );
}
