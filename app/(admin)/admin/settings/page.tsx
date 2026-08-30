"use client";

import { useEffect, useState } from "react";
import {
  Save, CheckCircle, Phone, Share2, BarChart2, AlignLeft,
  Image as ImageIcon, Layout, Settings, SlidersHorizontal, Palette, AlertCircle, Check,
  Plus, Trash2, Info, Target, HeartHandshake,
} from "lucide-react";
import { THEME_PRESETS, DEFAULT_THEME_PRESET } from "@/lib/theme-presets";
import { SECTION_ICONS, DEFAULT_SECTION_ICON, type HomepageContent, type HeroSlide, type ContentItem } from "@/lib/homepage-content";
import ImageUpload from "@/components/admin/ImageUpload";

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
  { key: "about",    label: "About",    icon: Info,       description: "About section photo, headline, and badge text." },
  { key: "mission",  label: "Mission",  icon: Target,     description: "Our Mission cards — add, edit, remove, or reorder." },
  { key: "whyjoin",  label: "Why Join", icon: HeartHandshake, description: "Why Join benefit cards — add, edit, remove, or reorder." },
  { key: "assets",   label: "Assets",   icon: ImageIcon,  description: "Logo URLs, favicon, and other asset references used across the site." },
];

// Settings that use a select dropdown instead of a text input
const SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  member_mode: [
    { value: "venue", label: "Venue Mode — members are event venues (banquet halls, resorts, etc.)" },
    { value: "person", label: "Person Mode — members are individual people or professionals" },
  ],
};

function SaveBar({ tabKey, savingContent, savedContent, contentError, onSave }: {
  tabKey: string;
  savingContent: string | null;
  savedContent: string | null;
  contentError: string;
  onSave: () => void;
}) {
  const isSaving = savingContent === tabKey;
  const isSaved = savedContent === tabKey;
  return (
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
      {contentError ? (
        <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle size={12} /> {contentError}</p>
      ) : <span />}
      <button
        onClick={onSave}
        disabled={isSaving}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-[#0a1040] text-white hover:bg-[#0d1550] transition-colors disabled:opacity-50 min-h-[40px] justify-center flex-shrink-0"
      >
        {isSaved ? (
          <><CheckCircle size={14} className="text-green-400" /> Saved</>
        ) : (
          <><Save size={14} /> {isSaving ? "Saving…" : "Save changes"}</>
        )}
      </button>
    </div>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 max-w-xs">
      {Object.entries(SECTION_ICONS).map(([name, Icon]) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          title={name}
          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
            (value || DEFAULT_SECTION_ICON) === name
              ? "bg-[#0a1040] border-[#0a1040] text-white"
              : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
          }`}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}

const MAX_HERO_SLIDES = 4;
const MAX_CONTENT_ITEMS = 6;

function HeroSlidesEditor({ slides, onChange, ...saveBarProps }: {
  slides: HeroSlide[];
  onChange: (slides: HeroSlide[]) => void;
} & Omit<Parameters<typeof SaveBar>[0], "tabKey"> & { description?: string }) {
  function updateSlide(i: number, patch: Partial<HeroSlide>) {
    onChange(slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function removeSlide(i: number) {
    onChange(slides.filter((_, idx) => idx !== i));
  }
  function addSlide() {
    onChange([...slides, { image: "", label: "" }]);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <SaveBar tabKey="hero" {...saveBarProps} />
      <div className="p-6 space-y-5">
        <p className="text-xs text-gray-400">
          Up to {MAX_HERO_SLIDES} background images that rotate on the homepage hero. Leave empty to use the default stock photos.
        </p>
        {slides.length === 0 && (
          <p className="text-sm text-gray-400 italic">No custom slides set — showing default stock images.</p>
        )}
        <div className="space-y-4">
          {slides.map((slide, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex-1">
                <ImageUpload value={slide.image} onChange={(url) => updateSlide(i, { image: url })} />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Caption (e.g. Grand Banquet Halls)"
                  value={slide.label}
                  onChange={(e) => updateSlide(i, { label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  onClick={() => removeSlide(i)}
                  className="self-start inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  <Trash2 size={12} /> Remove slide
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addSlide}
          disabled={slides.length >= MAX_HERO_SLIDES}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#0a1040] border border-dashed border-gray-300 rounded-xl hover:border-[#0a1040] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={14} /> Add slide {slides.length >= MAX_HERO_SLIDES && `(max ${MAX_HERO_SLIDES})`}
        </button>
      </div>
    </div>
  );
}

function EventsHeaderEditor({ eventsHeadline, eventsSubtitle, onChange, ...saveBarProps }: {
  eventsHeadline: string;
  eventsSubtitle: string;
  onChange: (patch: { eventsHeadline?: string; eventsSubtitle?: string }) => void;
} & Omit<Parameters<typeof SaveBar>[0], "tabKey">) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <SaveBar tabKey="events-header" {...saveBarProps} />
      <div className="p-6 space-y-5">
        <p className="text-xs text-gray-400">Headline and subtitle shown at the top of the public Events page.</p>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Headline</label>
          <input
            type="text"
            placeholder="What We Do"
            value={eventsHeadline}
            onChange={(e) => onChange({ eventsHeadline: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Subtitle</label>
          <input
            type="text"
            placeholder="Bringing our community together through meaningful programs"
            value={eventsSubtitle}
            onChange={(e) => onChange({ eventsSubtitle: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>
    </div>
  );
}

function LogoEditor({ logo, onChange, ...saveBarProps }: {
  logo: string;
  onChange: (logo: string) => void;
} & Omit<Parameters<typeof SaveBar>[0], "tabKey">) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <SaveBar tabKey="logo" {...saveBarProps} />
      <div className="p-6">
        <label className="text-sm font-medium text-gray-700 block mb-2">Association Logo</label>
        <p className="text-xs text-gray-400 mb-2">
          Shown in the site header and footer. Leave blank to use a plain placeholder — nothing that resembles another association&apos;s branding is ever shown by default.
        </p>
        <ImageUpload value={logo} onChange={onChange} />
      </div>
    </div>
  );
}

function AboutEditor({ aboutImage, aboutHeadline, aboutBadge, onChange, ...saveBarProps }: {
  aboutImage: string;
  aboutHeadline: string;
  aboutBadge: string;
  onChange: (patch: { aboutImage?: string; aboutHeadline?: string; aboutBadge?: string }) => void;
} & Omit<Parameters<typeof SaveBar>[0], "tabKey">) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <SaveBar tabKey="about" {...saveBarProps} />
      <div className="p-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Photo</label>
          <p className="text-xs text-gray-400 mb-2">Leave blank to use the default stock photo.</p>
          <ImageUpload value={aboutImage} onChange={(url) => onChange({ aboutImage: url })} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Headline</label>
          <input
            type="text"
            placeholder="Leading Nepal's Professional Community Forward"
            value={aboutHeadline}
            onChange={(e) => onChange({ aboutHeadline: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Badge text</label>
          <input
            type="text"
            placeholder="Official Industry Body"
            value={aboutBadge}
            onChange={(e) => onChange({ aboutBadge: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>
    </div>
  );
}

function ContentItemsEditor({ items, onChange, ...saveBarProps }: {
  tabKey: string;
  items: ContentItem[];
  onChange: (items: ContentItem[]) => void;
} & Omit<Parameters<typeof SaveBar>[0], "tabKey"> & { tabKey: string }) {
  function updateItem(i: number, patch: Partial<ContentItem>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function removeItem(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function addItem() {
    onChange([...items, { icon: DEFAULT_SECTION_ICON, title: "", desc: "" }]);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <SaveBar {...saveBarProps} />
      <div className="p-6 space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-gray-400 italic">
            No custom cards yet — the site is currently showing default content. Add a card to start customizing, or leave this empty to keep the defaults.
          </p>
        )}
        {items.map((item, i) => (
          <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <IconPicker value={item.icon} onChange={(icon) => updateItem(i, { icon })} />
              <button
                onClick={() => removeItem(i)}
                className="flex-shrink-0 text-red-400 hover:text-red-600"
                title="Remove card"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Card title"
              value={item.title}
              onChange={(e) => updateItem(i, { title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <textarea
              placeholder="Card description"
              value={item.desc}
              onChange={(e) => updateItem(i, { desc: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>
        ))}
        <button
          onClick={addItem}
          disabled={items.length >= MAX_CONTENT_ITEMS}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#0a1040] border border-dashed border-gray-300 rounded-xl hover:border-[#0a1040] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={14} /> Add card {items.length >= MAX_CONTENT_ITEMS && `(max ${MAX_CONTENT_ITEMS})`}
        </button>
      </div>
    </div>
  );
}

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

  const [logo, setLogo] = useState("");

  // Hero/About/Mission/WhyJoin all live in one Association.homepageContent JSON blob — this is
  // the last-loaded/saved server state; each tab keeps its own draft and merges into this on save
  // so saving one tab never clobbers another tab's unsaved-elsewhere fields.
  const [homepageContent, setHomepageContent] = useState<HomepageContent>({});
  const [savingContent, setSavingContent] = useState<string | null>(null); // tab key currently saving
  const [savedContent,  setSavedContent]  = useState<string | null>(null); // tab key just saved
  const [contentError,  setContentError]  = useState("");

  function load() {
    setLoadError("");
    Promise.all([
      fetch("/api/settings").then((r) => r.json()) as Promise<Setting[]>,
      fetch("/api/admin/branding").then((r) => r.json()) as Promise<{ success: boolean; data: { logo: string | null; colorPreset: string; homepageContent: HomepageContent } }>,
    ])
      .then(([settingsData, brandingJson]) => {
        setSettings(settingsData);
        setValues(Object.fromEntries(settingsData.map((s) => [s.key, s.value])));
        if (brandingJson.success) {
          setLogo(brandingJson.data.logo ?? "");
          setColorPreset(brandingJson.data.colorPreset);
          setHomepageContent(brandingJson.data.homepageContent ?? {});
        }
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

  async function saveLogo() {
    setSavingContent("logo");
    setContentError("");
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo }),
      });
      const json = await res.json() as { success: boolean; data?: { logo: string | null }; error?: string };
      if (!json.success) throw new Error(json.error ?? "Failed to save");
      setLogo(json.data?.logo ?? "");
      setSavedContent("logo");
      setTimeout(() => setSavedContent(null), 2500);
    } catch {
      setContentError("Couldn't save the logo. Please try again.");
    } finally {
      setSavingContent(null);
    }
  }

  async function saveHomepageContent(tabKey: string) {
    setSavingContent(tabKey);
    setContentError("");
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homepageContent }),
      });
      const json = await res.json() as { success: boolean; data?: { homepageContent: HomepageContent }; error?: string };
      if (!json.success || !json.data) throw new Error(json.error ?? "Failed to save");
      setHomepageContent(json.data.homepageContent);
      setSavedContent(tabKey);
      setTimeout(() => setSavedContent(null), 2500);
    } catch {
      setContentError("Couldn't save. Please try again.");
    } finally {
      setSavingContent(null);
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

  const genericRowsBlock = rows.length > 0 ? (
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
              {s.key === "favicon_image" || s.key === "default_member_image" ? (
                <ImageUpload
                  value={values[s.key] ?? ""}
                  onChange={(url) => setValues((p) => ({ ...p, [s.key]: url }))}
                />
              ) : SELECT_OPTIONS[s.key] ? (
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
  ) : null;

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
      ) : activeTab === "hero" ? (
        <div className="space-y-6">
          <HeroSlidesEditor
            slides={homepageContent.heroSlides ?? []}
            onChange={(heroSlides) => setHomepageContent((p) => ({ ...p, heroSlides }))}
            savingContent={savingContent}
            savedContent={savedContent}
            contentError={contentError}
            onSave={() => saveHomepageContent("hero")}
          />
          <EventsHeaderEditor
            eventsHeadline={homepageContent.eventsHeadline ?? ""}
            eventsSubtitle={homepageContent.eventsSubtitle ?? ""}
            onChange={(patch) => setHomepageContent((p) => ({ ...p, ...patch }))}
            savingContent={savingContent}
            savedContent={savedContent}
            contentError={contentError}
            onSave={() => saveHomepageContent("events-header")}
          />
          {genericRowsBlock}
        </div>
      ) : activeTab === "about" ? (
        <AboutEditor
          aboutImage={homepageContent.aboutImage ?? ""}
          aboutHeadline={homepageContent.aboutHeadline ?? ""}
          aboutBadge={homepageContent.aboutBadge ?? ""}
          onChange={(patch) => setHomepageContent((p) => ({ ...p, ...patch }))}
          savingContent={savingContent}
          savedContent={savedContent}
          contentError={contentError}
          onSave={() => saveHomepageContent("about")}
        />
      ) : activeTab === "mission" ? (
        <ContentItemsEditor
          tabKey="mission"
          items={homepageContent.missionItems ?? []}
          onChange={(missionItems) => setHomepageContent((p) => ({ ...p, missionItems }))}
          savingContent={savingContent}
          savedContent={savedContent}
          contentError={contentError}
          onSave={() => saveHomepageContent("mission")}
        />
      ) : activeTab === "whyjoin" ? (
        <ContentItemsEditor
          tabKey="whyjoin"
          items={homepageContent.whyjoinItems ?? []}
          onChange={(whyjoinItems) => setHomepageContent((p) => ({ ...p, whyjoinItems }))}
          savingContent={savingContent}
          savedContent={savedContent}
          contentError={contentError}
          onSave={() => saveHomepageContent("whyjoin")}
        />
      ) : activeTab === "assets" ? (
        <div className="space-y-6">
          <LogoEditor
            logo={logo}
            onChange={setLogo}
            savingContent={savingContent}
            savedContent={savedContent}
            contentError={contentError}
            onSave={saveLogo}
          />
          {genericRowsBlock}
        </div>
      ) : genericRowsBlock ? (
        genericRowsBlock
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
