"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CommitteeMember } from "@prisma/client";
import ImageUpload from "./ImageUpload";
import {
  User, Briefcase, Camera,
  ChevronRight, ChevronLeft, Check, Info, Star, Loader2,
  Search, Building2, X, Sparkles, Languages, Hash,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_KEYS: { key: string; label: string; desc: string }[] = [
  { key: "president",                label: "President",                desc: "Head of the association" },
  { key: "immediate_past_president", label: "Immediate Past President", desc: "Previous term president" },
  { key: "senior_vice_president",    label: "Senior Vice President",    desc: "Second-in-command" },
  { key: "vice_president",           label: "Vice President",           desc: "VP / joint VP" },
  { key: "general_secretary",        label: "General Secretary",        desc: "Heads the secretariat" },
  { key: "secretary",                label: "Secretary",                desc: "Executive secretary" },
  { key: "treasurer",                label: "Treasurer",                desc: "Manages finances" },
  { key: "member",                   label: "Executive Member",         desc: "Committee member" },
];

const BS_MONTHS = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik",  "Mangsir", "Poush", "Magh",    "Falgun", "Chaitra",
];

const AD_MONTHS = [
  "January", "February", "March",     "April",   "May",      "June",
  "July",    "August",   "September", "October", "November", "December",
];

// ─── BS/AD Conversion (approximate) ──────────────────────────────────────────
// BS new year (Baisakh 1) falls ~Apr 13-14. Approximation is accurate to ±1 month.
function adToBS(adYear: number, adMonth: number) {
  if (adMonth <= 4) return { year: adYear + 56, month: adMonth + 8 };
  return { year: adYear + 57, month: adMonth - 4 };
}
function bsToAD(bsYear: number, bsMonth: number) {
  if (bsMonth <= 8) return { year: bsYear - 57, month: bsMonth + 4 };
  return { year: bsYear - 56, month: bsMonth - 8 };
}

// ─── MyMemory translate helper ────────────────────────────────────────────────
async function myMemoryTranslate(text: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ne`
    );
    const data = await res.json() as { responseData?: { translatedText?: string }; responseStatus?: number };
    const t = data?.responseData?.translatedText;
    return t && data.responseStatus === 200 ? t : null;
  } catch { return null; }
}

const STEPS = [
  { id: 1, label: "Identity",    icon: User,     hint: "Name and role within the committee" },
  { id: 2, label: "Affiliation", icon: Briefcase, hint: "Venue, organization, and display order" },
  { id: 3, label: "Profile",     icon: Camera,   hint: "Biography and photo" },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface MemberOption {
  id: string; name: string; nameNe: string | null; area: string;
  image: string | null; phone: string | null; email: string | null; description: string | null;
}
interface DesignationOption { id: string; name: string; }
interface Props { member?: CommitteeMember; members?: MemberOption[]; designations?: DesignationOption[]; memberMode?: "venue" | "person"; }

// Maps a Designation's free-text name onto the fixed i18n translation keys the public
// Committee page uses (t.committee[roleKey]) — falls back to "member" (generic, always
// translated) for any custom designation name that doesn't match one of the known titles.
function deriveRoleKey(designationName: string): string {
  const match = ROLE_KEYS.find((r) => r.label.toLowerCase() === designationName.trim().toLowerCase());
  return match?.key ?? "member";
}

export default function CommitteeForm({ member, members = [], designations = [], memberMode = "venue" }: Props) {
  const isPersonMode = memberMode === "person";
  const router = useRouter();
  const [step,   setStep]   = useState(1);
  const [dir,    setDir]    = useState(1);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");
  const [bioLoading,   setBioLoading]   = useState(false);
  const [bioAiError,   setBioAiError]   = useState("");
  const [aiKeywords,   setAiKeywords]   = useState("");
  const [translatingName, setTranslatingName] = useState(false);
  const [translatingRole, setTranslatingRole] = useState(false);
  const [translatingVenue, setTranslatingVenue] = useState(false);
  const [translatingOrg, setTranslatingOrg] = useState(false);
  const [translatingBio, setTranslatingBio] = useState(false);

  // Manual edit refs — prevent auto-overwrite if user typed Nepali themselves
  const nameNeManualRef  = useRef(!!(member?.nameNe));
  const roleNeManualRef  = useRef(!!(member?.roleNe));
  const venueNeManualRef = useRef(!!(member?.venueNe));
  const orgNeManualRef   = useRef(!!(member?.organizationNe));
  const bioNeManualRef   = useRef(!!(member?.bioNe));

  // Member picker state — venue/organization this person represents (venue mode)
  const [memberSearch,   setMemberSearch]   = useState("");
  const [pickedMemberId, setPickedMemberId] = useState<string | null>(null);
  const pickedMember = members.find((m) => m.id === pickedMemberId) ?? null;

  // Identity link state — links this committee record to an existing Member
  // (snapshot-at-link-time: auto-fills name/photo/bio once, doesn't stay live-synced)
  const [identitySearch,   setIdentitySearch]   = useState("");
  const [identityMemberId, setIdentityMemberId] = useState<string | null>(member?.memberId ?? null);
  const identityMember = members.find((m) => m.id === identityMemberId) ?? null;

  // Designation link — this person's role in the association's own role vocabulary
  // (per-association, admin-editable at /admin/designations — falls back to the fixed
  // ROLE_KEYS grid only if the association has no designations set up yet)
  const [designationId, setDesignationId] = useState<string | null>(member?.designationId ?? null);

  const [form, setForm] = useState({
    name:           member?.name           ?? "",
    nameNe:         member?.nameNe         ?? "",
    role:           member?.role           ?? "",
    roleNe:         member?.roleNe         ?? "",
    roleKey:        member?.roleKey        ?? "member",
    organization:   member?.organization   ?? "",
    organizationNe: member?.organizationNe ?? "",
    venue:          member?.venue          ?? "",
    venueNe:        member?.venueNe        ?? "",
    bio:            member?.bio            ?? "",
    bioNe:          member?.bioNe          ?? "",
    order:          String(member?.order   ?? "99"),
    highlighted:    member?.highlighted    ?? false,
    image:          member?.image          ?? "",
    termYearBS:     String(member?.termYearBS  ?? ""),
    termMonthBS:    String(member?.termMonthBS ?? ""),
    termYearAD:     String(member?.termYearAD  ?? ""),
    termMonthAD:    String(member?.termMonthAD ?? ""),
  });

  // Known auto-filled labels — used to decide if role text was user-edited
  const knownLabels = ROLE_KEYS.map((r) => r.label);

  function set(k: string, v: string | boolean) {
    setForm((p) => {
      const next = { ...p, [k]: v };
      // Auto-fill role title when roleKey changes, unless user has typed something custom
      if (k === "roleKey" && typeof v === "string") {
        const label = ROLE_KEYS.find((r) => r.key === v)?.label ?? "";
        if (!p.role.trim() || knownLabels.includes(p.role)) {
          next.role = label;
          roleNeManualRef.current = false; // allow auto-translate of new role
        }
      }
      // BS/AD auto-conversion
      if (k === "termYearAD" || k === "termMonthAD") {
        const yr = Number(k === "termYearAD" ? v : p.termYearAD);
        const mo = Number(k === "termMonthAD" ? v : p.termMonthAD);
        if (yr > 1900 && mo >= 1 && mo <= 12) {
          const bs = adToBS(yr, mo);
          next.termYearBS  = String(bs.year);
          next.termMonthBS = String(bs.month);
        }
      }
      if (k === "termYearBS" || k === "termMonthBS") {
        const yr = Number(k === "termYearBS" ? v : p.termYearBS);
        const mo = Number(k === "termMonthBS" ? v : p.termMonthBS);
        if (yr > 2000 && mo >= 1 && mo <= 12) {
          const ad = bsToAD(yr, mo);
          next.termYearAD  = String(ad.year);
          next.termMonthAD = String(ad.month);
        }
      }
      return next;
    });
  }

  // ── Auto-translate effects ────────────────────────────────────────────────────
  useEffect(() => {
    if (nameNeManualRef.current || !form.name.trim()) return;
    const t = setTimeout(async () => {
      setTranslatingName(true);
      const r = await myMemoryTranslate(form.name);
      if (r) setForm((p) => ({ ...p, nameNe: r }));
      setTranslatingName(false);
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name]);

  useEffect(() => {
    if (roleNeManualRef.current || !form.role.trim()) return;
    const t = setTimeout(async () => {
      setTranslatingRole(true);
      const r = await myMemoryTranslate(form.role);
      if (r) setForm((p) => ({ ...p, roleNe: r }));
      setTranslatingRole(false);
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.role]);

  useEffect(() => {
    if (venueNeManualRef.current || !form.venue.trim()) return;
    const t = setTimeout(async () => {
      setTranslatingVenue(true);
      const r = await myMemoryTranslate(form.venue);
      if (r) setForm((p) => ({ ...p, venueNe: r }));
      setTranslatingVenue(false);
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.venue]);

  useEffect(() => {
    if (orgNeManualRef.current || !form.organization.trim()) return;
    const t = setTimeout(async () => {
      setTranslatingOrg(true);
      const r = await myMemoryTranslate(form.organization);
      if (r) setForm((p) => ({ ...p, organizationNe: r }));
      setTranslatingOrg(false);
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.organization]);

  useEffect(() => {
    if (bioNeManualRef.current || !form.bio.trim()) return;
    const t = setTimeout(async () => {
      setTranslatingBio(true);
      try {
        const res = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "translate", text: form.bio, targetLang: "ne" }),
        });
        const json = await res.json() as { success: boolean; data?: { text: string }; error?: string };
        if (json.success && json.data?.text) setForm((p) => ({ ...p, bioNe: json.data!.text }));
      } catch { /* silently fail */ }
      setTranslatingBio(false);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.bio]);

  function pickMember(m: MemberOption) {
    setPickedMemberId(m.id);
    setMemberSearch("");
    venueNeManualRef.current = true; // venue came from member picker, don't auto-overwrite
    setForm((p) => ({ ...p, venue: m.name, venueNe: m.nameNe ?? "" }));
  }

  function clearMember() {
    setPickedMemberId(null);
    venueNeManualRef.current = false;
    setForm((p) => ({ ...p, venue: "", venueNe: "" }));
  }

  function pickIdentityMember(m: MemberOption) {
    setIdentityMemberId(m.id);
    setIdentitySearch("");
    nameNeManualRef.current = true; // came from member record, don't auto-overwrite
    bioNeManualRef.current  = true;
    setForm((p) => ({
      ...p,
      name:   m.name,
      nameNe: m.nameNe ?? p.nameNe,
      image:  m.image ?? p.image,
      bio:    p.bio.trim() ? p.bio : (m.description ?? p.bio),
    }));
  }

  function clearIdentityMember() {
    setIdentityMemberId(null);
  }

  function pickDesignation(d: DesignationOption) {
    setDesignationId(d.id);
    roleNeManualRef.current = false; // allow auto-translate of the new role title
    setForm((p) => ({ ...p, role: d.name, roleKey: deriveRoleKey(d.name) }));
  }

  // ── AI Bio Generate ──────────────────────────────────────────────────────────
  async function generateBio() {
    setBioLoading(true); setBioAiError("");
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bio",
          name: form.name, role: form.role, venue: form.venue,
          organization: form.organization, keywords: aiKeywords,
        }),
      });
      const json = await res.json() as { success: boolean; data?: { text: string }; error?: string };
      if (!json.success || !json.data) throw new Error(json.error ?? "Generation failed");
      const bio = json.data.text;
      bioNeManualRef.current = false; // allow auto-translate
      setForm((p) => ({ ...p, bio }));

      // Auto-translate bio to Nepali
      setTranslatingBio(true);
      try {
        const tRes = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "translate", text: bio, targetLang: "ne" }),
        });
        const tJson = await tRes.json() as { success: boolean; data?: { text: string } };
        if (tJson.success && tJson.data?.text) setForm((p) => ({ ...p, bioNe: tJson.data!.text }));
      } catch { /* silently fail */ }
      setTranslatingBio(false);
    } catch (err) {
      setBioAiError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setBioLoading(false);
    }
  }

  // ── Validation ───────────────────────────────────────────────────────────────
  function validateStep(s: number): string {
    if (s === 1 && !form.name.trim())  return "Full name is required.";
    if (s === 1 && !form.role.trim())  return "Role title is required.";
    if (s === 2 && form.order && isNaN(Number(form.order))) return "Display order must be a number.";
    return "";
  }

  function goNext() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(""); setDir(1); setStep((s) => Math.min(STEPS.length, s + 1));
  }
  function goBack() { setError(""); setDir(-1); setStep((s) => Math.max(1, s - 1)); }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setSaving(true); setError("");

    const url    = member ? `/api/committee/${member.id}` : "/api/committee";
    const method = member ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        memberId:      identityMemberId,
        designationId,
        order:       Number(form.order),
        termYearBS:  form.termYearBS  ? Number(form.termYearBS)  : null,
        termMonthBS: form.termMonthBS ? Number(form.termMonthBS) : null,
        termYearAD:  form.termYearAD  ? Number(form.termYearAD)  : null,
        termMonthAD: form.termMonthAD ? Number(form.termMonthAD) : null,
      }),
    });

    if (!res.ok) {
      let msg = "Failed to save. Please try again.";
      try { const e = await res.json() as { error?: string }; msg = e.error ?? msg; } catch { /* empty */ }
      setError(msg);
      setSaving(false);
      return;
    }

    router.push("/admin/committee");
    router.refresh();
  }

  // ── Styles ───────────────────────────────────────────────────────────────────
  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition";

  function stepHint(s: number): string {
    if (s === 2 && isPersonMode) return "Organization and display order";
    return STEPS[s - 1].hint;
  }

  const stepVariants = {
    enter:  (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl">

      {/* ── Progress bar ──────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const cur  = step === s.id;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    animate={{ backgroundColor: done ? "#10b981" : cur ? "#f59e0b" : "#e5e7eb", scale: cur ? 1.15 : 1 }}
                    transition={{ duration: 0.25 }}
                    className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
                  >
                    {done
                      ? <Check size={16} className="text-white" strokeWidth={2.5} />
                      : <Icon size={16} className={cur ? "text-white" : "text-gray-400"} />
                    }
                  </motion.div>
                  <span className={`text-[10px] font-medium hidden sm:block ${cur ? "text-amber-600" : done ? "text-emerald-600" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 mx-2 h-0.5 rounded-full overflow-hidden bg-gray-200 mb-4">
                    <motion.div
                      animate={{ width: step > s.id ? "100%" : "0%" }}
                      transition={{ duration: 0.4 }}
                      className="h-full bg-emerald-400 rounded-full"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 text-center">
          Step {step} of {STEPS.length} — {stepHint(step)}
        </p>
      </div>

      {/* ── Card ──────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          {(() => {
            const Icon = STEPS[step - 1].icon;
            return <div className="p-2 bg-amber-50 rounded-xl"><Icon size={18} className="text-amber-600" /></div>;
          })()}
          <div>
            <h2 className="font-bold text-gray-900">{STEPS[step - 1].label}</h2>
            <p className="text-xs text-gray-400">{stepHint(step)}</p>
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="px-6 py-6 space-y-5"
          >

            {/* ── STEP 1 — Identity ────────────────────────────────────────────── */}
            {step === 1 && (<>
              {/* ── Link to an existing member ──────────────────────────────────── */}
              {members.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <User size={13} className="text-gray-400" />
                    Link to an existing member
                    <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  </label>
                  <p className="text-[11px] text-gray-400 mb-2">
                    If this committee member is already registered as a member, link their record to auto-fill name, photo, and bio below — everything stays editable after linking.
                  </p>

                  {identityMember ? (
                    <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <User size={14} className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{identityMember.name}</p>
                        <p className="text-xs text-gray-400">{identityMember.area}</p>
                      </div>
                      <button type="button" onClick={clearIdentityMember}
                        className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-500 hover:text-emerald-800 transition-colors flex-shrink-0"
                        title="Unlink">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={identitySearch}
                        onChange={(e) => setIdentitySearch(e.target.value)}
                        placeholder="Search members by name or area…"
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                      />
                      {identitySearch.trim() && (() => {
                        const q = identitySearch.toLowerCase();
                        const results = members.filter(
                          (m) => m.name.toLowerCase().includes(q) || m.area.toLowerCase().includes(q)
                        ).slice(0, 8);
                        return (
                          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                            {results.length === 0 ? (
                              <p className="px-4 py-3 text-xs text-gray-400">No members found matching &quot;{identitySearch}&quot;</p>
                            ) : results.map((m) => (
                              <button key={m.id} type="button" onClick={() => pickIdentityMember(m)}
                                className="w-full text-left px-4 py-2.5 hover:bg-amber-50 border-b border-gray-50 last:border-0 transition-colors">
                                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                                <p className="text-xs text-gray-400">{m.area}</p>
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Enter the member&apos;s name exactly as it should appear on the public website. The Nepali name is optional but recommended.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                    <User size={13} className="text-gray-400" /> Full Name (English) *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Ram Prasad Shrestha"
                    required
                    className={inputCls}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Use the full official name.</p>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                    <Languages size={13} className="text-indigo-400" /> नाम (Nepali Name)
                    {translatingName && <Loader2 size={10} className="animate-spin text-indigo-400" />}
                  </label>
                  <input
                    value={form.nameNe}
                    onChange={(e) => { nameNeManualRef.current = true; set("nameNe", e.target.value); }}
                    placeholder="auto-fills from English name"
                    className={inputCls}
                  />
                  <p className={`text-[11px] mt-1 ${!translatingName && form.name.trim() && !form.nameNe && !nameNeManualRef.current ? "text-amber-600" : "text-gray-400"}`}>
                    {translatingName
                      ? "Auto-translating…"
                      : (form.name.trim() && !form.nameNe && !nameNeManualRef.current)
                        ? "Couldn't auto-translate — please type it in yourself."
                        : "Auto-filled when you type the English name."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                    <Briefcase size={13} className="text-gray-400" /> Role Title (English) *
                  </label>
                  <input
                    value={form.role}
                    onChange={(e) => set("role", e.target.value)}
                    placeholder="e.g. President, Vice President"
                    required
                    className={inputCls}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Auto-filled when you pick a Role Category below.</p>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                    <Languages size={13} className="text-indigo-400" /> भूमिका (Nepali Role)
                    {translatingRole && <Loader2 size={10} className="animate-spin text-indigo-400" />}
                  </label>
                  <input
                    value={form.roleNe}
                    onChange={(e) => { roleNeManualRef.current = true; set("roleNe", e.target.value); }}
                    placeholder="auto-fills from English role"
                    className={inputCls}
                  />
                  <p className={`text-[11px] mt-1 ${!translatingRole && form.role.trim() && !form.roleNe && !roleNeManualRef.current ? "text-amber-600" : "text-gray-400"}`}>
                    {translatingRole
                      ? "Auto-translating…"
                      : (form.role.trim() && !form.roleNe && !roleNeManualRef.current)
                        ? "Couldn't auto-translate — please type it in yourself."
                        : "Auto-filled when role title is set."}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role Category *</label>
                <p className="text-[11px] text-gray-400 mb-2">
                  {designations.length > 0
                    ? "Picking a role auto-fills the role title above. Manage this list at Admin → Designations."
                    : "Used for sorting and grouping. Choose the closest match — this controls how the member is ranked in the committee list."}
                </p>
                {designations.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {designations.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => pickDesignation(d)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm transition-all text-left
                          ${designationId === d.id
                            ? "bg-amber-50 border-amber-400 text-amber-800 shadow-sm"
                            : "bg-white border-gray-200 text-gray-600 hover:border-amber-300"}`}
                      >
                        <span className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors
                          ${designationId === d.id ? "bg-amber-500 border-amber-500" : "border-gray-300"}`}>
                          {designationId === d.id && <Check size={9} className="text-white" strokeWidth={3} />}
                        </span>
                        <span className={`font-semibold text-sm leading-tight ${designationId === d.id ? "text-amber-800" : "text-gray-700"}`}>{d.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ROLE_KEYS.map(({ key, label, desc }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => set("roleKey", key)}
                        className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-sm transition-all text-left
                          ${form.roleKey === key
                            ? "bg-amber-50 border-amber-400 text-amber-800 shadow-sm"
                            : "bg-white border-gray-200 text-gray-600 hover:border-amber-300"}`}
                      >
                        <span className={`mt-0.5 w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors
                          ${form.roleKey === key ? "bg-amber-500 border-amber-500" : "border-gray-300"}`}>
                          {form.roleKey === key && <Check size={9} className="text-white" strokeWidth={3} />}
                        </span>
                        <div>
                          <div className={`font-semibold text-sm leading-tight ${form.roleKey === key ? "text-amber-800" : "text-gray-700"}`}>{label}</div>
                          <div className="text-[11px] text-gray-400">{desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>)}

            {/* ── STEP 2 — Affiliation ─────────────────────────────────────────── */}
            {step === 2 && (<>
              {!isPersonMode && (<>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Search for the member venue this person represents, or type the venue name manually below.
                </p>
              </div>

              {/* ── Member venue picker ─────────────────────────────────────────── */}
              {members.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Building2 size={13} className="text-gray-400" />
                    Pick from registered members
                    <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  </label>
                  <p className="text-[11px] text-gray-400 mb-2">
                    Selecting a member auto-fills the venue name below and keeps it consistent with the member directory.
                  </p>

                  {pickedMember ? (
                    // Selected state
                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Building2 size={14} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{pickedMember.name}</p>
                        <p className="text-xs text-gray-400">{pickedMember.area}</p>
                      </div>
                      <button type="button" onClick={clearMember}
                        className="p-1 rounded-lg hover:bg-blue-100 text-blue-400 hover:text-blue-700 transition-colors flex-shrink-0"
                        title="Clear selection">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    // Search state
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder="Search by venue name or area…"
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                      />
                      {memberSearch.trim() && (() => {
                        const q = memberSearch.toLowerCase();
                        const results = members.filter(
                          (m) => m.name.toLowerCase().includes(q) || m.area.toLowerCase().includes(q)
                        ).slice(0, 8);
                        return (
                          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                            {results.length === 0 ? (
                              <p className="px-4 py-3 text-xs text-gray-400">No members found matching &quot;{memberSearch}&quot;</p>
                            ) : results.map((m) => (
                              <button key={m.id} type="button" onClick={() => pickMember(m)}
                                className="w-full text-left px-4 py-2.5 hover:bg-amber-50 border-b border-gray-50 last:border-0 transition-colors">
                                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                                <p className="text-xs text-gray-400">{m.area}</p>
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Venue name fields (editable, pre-filled from picker) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                    <Building2 size={13} className="text-gray-400" /> Venue Name (English)
                  </label>
                  <input
                    value={form.venue}
                    onChange={(e) => { venueNeManualRef.current = false; set("venue", e.target.value); }}
                    placeholder="e.g. Grand Palace Banquet"
                    className={inputCls}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">The venue this person represents in the association.</p>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                    <Languages size={13} className="text-indigo-400" /> भेन्यू (Nepali Venue)
                    {translatingVenue && <Loader2 size={10} className="animate-spin text-indigo-400" />}
                  </label>
                  <input
                    value={form.venueNe}
                    onChange={(e) => { venueNeManualRef.current = true; set("venueNe", e.target.value); }}
                    placeholder="auto-fills from English venue name"
                    className={inputCls}
                  />
                </div>
              </div>
              </>)}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                    <Building2 size={13} className="text-gray-400" /> Organization
                  </label>
                  <input
                    value={form.organization}
                    onChange={(e) => set("organization", e.target.value)}
                    placeholder="e.g. Grand Palace Pvt. Ltd."
                    className={inputCls}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    {isPersonMode ? "Legal entity name, if applicable." : "Legal entity name. Leave blank if same as venue."}
                  </p>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                    <Languages size={13} className="text-indigo-400" /> संस्था (Nepali Org)
                    {translatingOrg && <Loader2 size={10} className="animate-spin text-indigo-400" />}
                  </label>
                  <input
                    value={form.organizationNe}
                    onChange={(e) => { orgNeManualRef.current = true; set("organizationNe", e.target.value); }}
                    placeholder="auto-fills from organization name"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  min={1}
                  value={form.order}
                  onChange={(e) => set("order", e.target.value)}
                  placeholder="e.g. 1 = first, 99 = last"
                  className={`${inputCls} max-w-[180px]`}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Lower numbers appear first on the committee page. President is typically 1.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-amber-300 transition-colors">
                <input
                  type="checkbox"
                  checked={form.highlighted}
                  onChange={(e) => set("highlighted", e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                    <Star size={13} className="text-amber-500" /> Highlighted Position
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Tick this for President, Vice Presidents, and other office bearers. Shown with a gold badge on the public website.
                  </p>
                </div>
              </label>

              {/* ── Term year (optional — used when editing archived members) ───── */}
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-0.5">Election / Term Year</p>
                  <p className="text-[11px] text-gray-400">
                    Set either BS or AD — the other is auto-calculated. Leave blank for the active committee.
                  </p>
                </div>

                {/* AD row */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">AD (English Calendar)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">AD Year</label>
                      <input
                        type="number"
                        value={form.termYearAD}
                        onChange={(e) => set("termYearAD", e.target.value)}
                        placeholder="e.g. 2025"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">AD Month</label>
                      <select value={form.termMonthAD} onChange={(e) => set("termMonthAD", e.target.value)} className={inputCls}>
                        <option value="">— month —</option>
                        {AD_MONTHS.map((m, i) => (
                          <option key={m} value={String(i + 1)}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* BS row */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">BS (Nepali Calendar)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">BS Year</label>
                      <input
                        type="number"
                        value={form.termYearBS}
                        onChange={(e) => set("termYearBS", e.target.value)}
                        placeholder="e.g. 2082"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">BS Month</label>
                      <select value={form.termMonthBS} onChange={(e) => set("termMonthBS", e.target.value)} className={inputCls}>
                        <option value="">— month —</option>
                        {BS_MONTHS.map((m, i) => (
                          <option key={m} value={String(i + 1)}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Conversion preview */}
                {(form.termYearAD || form.termYearBS) && (
                  <div className="flex items-center gap-2 text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                    <Info size={11} className="flex-shrink-0" />
                    {form.termYearAD && form.termMonthAD
                      ? `AD: ${AD_MONTHS[Number(form.termMonthAD) - 1]} ${form.termYearAD}  →  BS: ${BS_MONTHS[Number(form.termMonthBS) - 1] ?? "—"} ${form.termYearBS || "—"}`
                      : form.termYearBS && form.termMonthBS
                      ? `BS: ${BS_MONTHS[Number(form.termMonthBS) - 1]} ${form.termYearBS}  →  AD: ${AD_MONTHS[Number(form.termMonthAD) - 1] ?? "—"} ${form.termYearAD || "—"}`
                      : "Enter year and month in either calendar to auto-convert"
                    }
                  </div>
                )}
              </div>
            </>)}

            {/* ── STEP 3 — Profile ─────────────────────────────────────────────── */}
            {step === 3 && (<>
              <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-purple-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-purple-700">
                  Add a short biography and profile photo. Both are optional but greatly improve the committee page presentation.
                </p>
              </div>

              {/* AI bio keywords + generate */}
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
                  <Sparkles size={12} /> AI Biography Generation
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-violet-700 mb-1">
                    <Hash size={11} /> Keywords / hints
                    <span className="text-violet-400 font-normal">(optional)</span>
                  </label>
                  <input
                    value={aiKeywords}
                    onChange={(e) => setAiKeywords(e.target.value)}
                    placeholder="e.g. 15 years experience, luxury weddings, community leader, award winner"
                    className="w-full px-3 py-2 border border-violet-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <p className="text-[11px] text-violet-500 mt-1">The AI will weave these into the biography naturally — not just list them.</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-violet-600 font-medium truncate max-w-[55%]">
                    {form.name || <span className="text-violet-400">Enter a name in Step 1 first</span>}
                    {form.role && <span className="text-violet-400"> — {form.role}</span>}
                  </p>
                  <button
                    type="button"
                    onClick={generateBio}
                    disabled={!form.name || bioLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {bioLoading ? <><Loader2 size={11} className="animate-spin" /> Generating…</> : <><Sparkles size={11} /> Generate Bio</>}
                  </button>
                </div>
              </div>

              {bioAiError && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{bioAiError}</div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Biography (English)</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => { bioNeManualRef.current = false; set("bio", e.target.value); }}
                  rows={5}
                  placeholder={isPersonMode
                    ? "A brief introduction — background, experience, and their role in the association…"
                    : "A brief introduction — background, experience, and their role at the venue…"}
                  className={`${inputCls} resize-none`}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Shown on the committee member&apos;s public card. Aim for 2–4 sentences.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <Languages size={13} className="text-indigo-400" /> जीवनी (Nepali Biography)
                    {translatingBio && <Loader2 size={10} className="animate-spin text-indigo-400" />}
                  </label>
                  {translatingBio && <span className="text-[11px] text-indigo-500">Auto-translating…</span>}
                </div>
                <textarea
                  value={form.bioNe}
                  onChange={(e) => { bioNeManualRef.current = true; set("bioNe", e.target.value); }}
                  rows={5}
                  placeholder="नेपालीमा जीवनी — auto-fills from English biography above"
                  className={`${inputCls} resize-none`}
                />
                <p className="text-[11px] text-gray-400 mt-1">Auto-translated when you type or generate the English bio. Edit freely to correct.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Photo</label>
                <ImageUpload value={form.image} onChange={(url) => set("image", url)} />
                <p className="text-[11px] text-gray-400 mt-2">
                  Use a clear, professional headshot. JPG or PNG, under 2 MB.
                </p>
              </div>

              {/* Summary review */}
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Review before saving</p>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Name:</span>{" "}
                  {form.name || <span className="text-red-400 italic">missing</span>}
                  {form.nameNe && <span className="text-gray-400 ml-1">({form.nameNe})</span>}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Role:</span>{" "}
                  {form.role || <span className="text-red-400 italic">missing</span>}
                  <span className="text-gray-400 ml-1">
                    ({ROLE_KEYS.find((r) => r.key === form.roleKey)?.label ?? form.roleKey})
                  </span>
                </div>
                {form.venue && (
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Venue:</span> {form.venue}
                  </div>
                )}
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Display order:</span> {form.order}
                  {form.highlighted && <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full">★ Highlighted</span>}
                </div>
              </div>
            </>)}

          </motion.div>
        </AnimatePresence>

        {/* ── Footer — error + navigation ───────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          {error && (
            <div className="mb-3 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
              <Info size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} /> Back
            </button>

            {step < STEPS.length ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#0a1040] text-white text-sm font-medium rounded-xl hover:bg-[#0d1550] transition-colors"
              >
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <><Loader2 size={14} className="animate-spin" />{member ? "Updating…" : "Saving…"}</>
                ) : (
                  <><Check size={14} />{member ? "Update Member" : "Add to Committee"}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
