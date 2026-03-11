"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: string;
  label: string;
  group: string;
}

const groupLabels: Record<string, string> = {
  contact: "Contact Information",
  social: "Social Media Links",
  stats: "Statistics",
  footer: "Footer",
};

const groupOrder = ["contact", "social", "stats", "footer"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

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

  const grouped = groupOrder.reduce<Record<string, Setting[]>>((acc, g) => {
    acc[g] = settings.filter((s) => s.group === g);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Site Settings</h1>
      <p className="text-gray-500 text-sm mb-8">
        Edit contact information, social links, and other content shown on the public website.
      </p>

      <div className="space-y-8">
        {groupOrder.map((group) => {
          const rows = grouped[group] ?? [];
          if (!rows.length) return null;
          return (
            <div key={group} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{groupLabels[group] ?? group}</h2>
                <button
                  onClick={() => saveGroup(group)}
                  disabled={saving[group]}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#0a1040] text-white hover:bg-[#0d1550] transition-colors disabled:opacity-50"
                >
                  {saved[group] ? (
                    <>
                      <CheckCircle size={14} className="text-green-400" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      {saving[group] ? "Saving…" : "Save"}
                    </>
                  )}
                </button>
              </div>

              <div className="divide-y divide-gray-50">
                {rows.map((s) => (
                  <div key={s.key} className="px-6 py-4 flex items-start gap-4">
                    <label className="w-48 text-sm font-medium text-gray-700 pt-2 flex-shrink-0">
                      {s.label}
                    </label>
                    <div className="flex-1">
                      {s.value.length > 80 || s.key.includes("tagline") ? (
                        <textarea
                          value={values[s.key] ?? ""}
                          onChange={(e) => setValues((p) => ({ ...p, [s.key]: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                        />
                      ) : (
                        <input
                          type={s.key.includes("url") || s.key.includes("social") ? "url" : "text"}
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
          );
        })}
      </div>
    </div>
  );
}
