"use client";

import { useEffect, useState } from "react";
import {
  Save, CheckCircle, Phone, Share2, BarChart2, AlignLeft,
  Image as ImageIcon, Layout, Settings, SlidersHorizontal, Palette, AlertCircle, Check,
} from "lucide-react";
import { THEME_PRESETS, DEFAULT_THEME_PRESET } from "@/lib/theme-presets";

interface Setting {
  id: string;
  key: string;
  value: string;
  label: string;
  group: string;
}

const GROUP_CONFIG: { key: string; label: string; icon: React.ElementType; description: string }[] = [
  { key: "general",  label: "General",  icon: SlidersHorizontal, description: "Core platform settings: member mode and other association-wide preferences." },
  { key: "branding", label: "Branding", icon: Palette,    description: "Pick a curated color combination for your public site and member portal." },
  { key: "contact",  label: "Contact",  icon: Phone,      description: "Phone, email, address, and map URL shown on the public contact section." },
  { key: "social",   label: "Social",   icon: Share2,     description: "Facebook, Instagram, YouTube and other social media links." },
  { key: "stats",    label: "Stats",    icon: BarChart2,  description: "Statistics shown on the public homepage (member count, years active, etc.)." },
  { key: "footer",   label: "Footer",   icon: AlignLeft,  description: "Footer text, copyright, and links shown at the bottom of the public site." },
  { key: "hero",     label: "Hero",     icon: Layout,     description: "Homepage hero section: headline, tagline, and call-to-action text." },
  { key: "assets",   label: "Assets",   icon: ImageIcon,  description: "Logo URLs, favicon, and other asset references used across the site." },
];

// Settings that use a select dropdown instead of a text input
const SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  member_mode: [
    { value: "venue", label: "Venue Mode — members are event venues (banquet halls, resorts, etc.)" },
    { value: "person", label: "Person Mode — members are individual people or professionals" },
  ],
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values,   setValues]   = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState<Record<string, boolean>>({});
  const [saved,    setSaved]    = useState<Record<string, boolean>>({});
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  const [colorPreset,    setColorPreset]    = useState<string>(DEFAULT_THEME_PRESET);
  const [savingBranding, setSavingBranding] = useState<string | null>(null);
  const [brandingError,  setBrandingError]  = useState("");

  function load() {
    setLoadError("");
    Promise.all([
      fetch("/api/settings").then((r) => r.json()) as Promise<Setting[]>,
      fetch("/api/admin/branding").then((r) => r.json()) as Promise<{ success: boolean; data: { colorPreset: string } }>,
    ])
      .then(([settingsData, brandingJson]) => {
        setSettings(settingsData);
        setValues(Object.fromEntries(settingsData.map((s) => [s.key, s.value])));
        if (brandingJson.success) setColorPreset(brandingJson.data.colorPreset);
      })
      .catch(() => setLoadError("Couldn't load settings. Check your connection and try again."));
  }

  useEffect(() => { load(); }, []);

  async function selectPreset(key: string) {
    setSavingBranding(key);
    setBrandingError("");
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colorPreset: key }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error ?? "Failed to save");
      setColorPreset(key);
    } catch {
      setBrandingError("Couldn't save your color preset. Please try again.");
    } finally {
      setSavingBranding(null);
    }
  }

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
      {loadError ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <AlertCircle size={28} className="text-amber-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{loadError}</p>
          <button
            onClick={load}
            className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-[#0a1040] rounded-lg hover:bg-[#0d1550] transition-colors"
          >
            Try again
          </button>
        </div>
      ) : activeTab === "branding" ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Branding</h2>
            <p className="text-xs text-gray-400 mt-0.5">{activeGroup?.description}</p>
          </div>

          <div className="p-6">
            {brandingError && (
              <p className="mb-4 text-xs text-red-500 flex items-center gap-1.5">
                <AlertCircle size={12} /> {brandingError}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.values(THEME_PRESETS).map((preset) => {
                const isActive = colorPreset === preset.key;
                const isSaving = savingBranding === preset.key;
                return (
                  <button
                    key={preset.key}
                    onClick={() => selectPreset(preset.key)}
                    disabled={savingBranding !== null}
                    className={`relative flex flex-col items-center gap-2.5 px-4 py-5 rounded-2xl border-2 transition-colors disabled:opacity-60 ${
                      isActive ? "border-[#0a1040] bg-slate-50" : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-[#0a1040] text-white">
                        <Check size={11} />
                      </span>
                    )}
                    <span
                      className="w-11 h-11 rounded-full overflow-hidden flex shadow-inner"
                      style={{ backgroundColor: preset.primary[800] }}
                    >
                      <span className="w-1/2 h-full" style={{ backgroundColor: preset.primary[800] }} />
                      <span className="w-1/2 h-full" style={{ backgroundColor: preset.accent[500] }} />
                    </span>
                    <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                      {isSaving ? "Saving…" : preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : rows.length > 0 ? (
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
                  {SELECT_OPTIONS[s.key] ? (
                    <select
                      value={values[s.key] ?? ""}
                      onChange={(e) => setValues((p) => ({ ...p, [s.key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    >
                      {SELECT_OPTIONS[s.key].map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (values[s.key] ?? "").length > 80 || s.key.includes("tagline") || s.key.includes("address") || s.key.includes("description") || s.key.includes("bio") ? (
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
