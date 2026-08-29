"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Member } from "@prisma/client";
import ImageUpload from "./ImageUpload";
import {
  User, MapPin, Phone, ChevronRight, ChevronLeft, Check, Info, Plus, X,
  Facebook, Instagram, Youtube, Globe, Mail, Star, Loader2, AlertTriangle, Receipt,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Basic Info", icon: User,  hint: "Name, profession, and location" },
  { id: 2, label: "Contact",    icon: Phone, hint: "Phone, email, and photo" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidNepaliPhone(v: string) {
  return /^(9[6-8]\d{8}|0[1-9]\d{5,7})$/.test(v.replace(/[\s\-\(\)]/g, ""));
}
function isValidEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function lc(s: string) { return s.toLowerCase().trim(); }

// ─── Component ────────────────────────────────────────────────────────────────

interface CategoryOption {
  id: string;
  name: string;
  annualRenewalFee: string; // Decimal serialized as string
}

type BillingOption = "pending" | "paid" | "none";

interface Props {
  member?: Member;
  showPhone?: boolean;  // from MemberAssociation — editable per-association visibility flag
  showEmail?: boolean;
}

export default function PersonMemberForm({ member, showPhone: initialShowPhone = false, showEmail: initialShowEmail = false }: Props) {
  const router = useRouter();
  const [step,   setStep]   = useState(1);
  const [dir,    setDir]    = useState(1);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  // Membership category + billing (new member only)
  const [memberCategories, setMemberCategories] = useState<CategoryOption[]>([]);
  const [memberCategoryId, setMemberCategoryId]  = useState<string>("");
  const [billingOption,    setBillingOption]     = useState<BillingOption>("pending");

  useEffect(() => {
    if (member) return; // edit mode — skip
    fetch("/api/membership/categories")
      .then((r) => r.json())
      .then((res: { success: boolean; data?: CategoryOption[] }) => {
        if (res.success && res.data) setMemberCategories(res.data);
      })
      .catch(() => { /* silently ignore if categories unavailable */ });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const parseMulti = (v: string | null | undefined) =>
    v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const [form, setForm] = useState({
    name:        member?.name        ?? "",
    slug:        member?.slug        ?? "",
    area:        member?.area        ?? "",   // reused as "location"
    category:    member?.category    ?? "",   // reused as "profession"
    description: member?.description ?? "",   // bio
    memberSince: member?.memberSince ?? "",
    email:       member?.email       ?? "",
    website:     member?.website     ?? "",
    facebook:    member?.facebook    ?? "",
    instagram:   member?.instagram   ?? "",
    youtube:     member?.youtube     ?? "",
    image:       member?.image       ?? "",
    featured:    member?.featured    ?? false,
  });

  const [showPhone, setShowPhone] = useState(initialShowPhone);
  const [showEmail, setShowEmail] = useState(initialShowEmail);

  const [phones, setPhones] = useState<string[]>(() => {
    if (member?.phones && member.phones.length > 0) return member.phones;
    const fromPhone = parseMulti(member?.phone);
    return fromPhone.length ? fromPhone : [""];
  });
  const [phoneErrors, setPhoneErrors] = useState<boolean[]>(phones.map(() => false));

  function set(k: string, v: string | boolean) {
    setForm((p) => ({ ...p, [k]: v }));
    if (k === "name" && !member) {
      const slug = (v as string).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      setForm((p) => ({ ...p, slug }));
    }
  }
  function addPhone() { setPhones((p) => [...p, ""]); setPhoneErrors((e) => [...e, false]); }
  function removePhone(i: number) { setPhones((p) => p.filter((_, x) => x !== i)); setPhoneErrors((e) => e.filter((_, x) => x !== i)); }
  function setPhone(i: number, v: string) {
    setPhones((p) => p.map((x, idx) => idx === i ? v : x));
    setPhoneErrors((e) => e.map((x, idx) => idx === i ? (v !== "" && !isValidNepaliPhone(v)) : x));
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateStep(s: number): string {
    if (s === 1 && !form.name.trim()) return "Name is required.";
    if (s === 1 && !form.slug.trim()) return "Slug is required.";
    if (s === 1 && !form.area.trim()) return "Location is required.";
    if (s === 2) {
      const bad = phones.filter((p) => p.trim()).filter((p) => !isValidNepaliPhone(p));
      if (bad.length) return "One or more phone numbers are invalid. Use 98XXXXXXXX or 01XXXXXXX format.";
      if (form.email && !isValidEmail(form.email)) return "Please enter a valid email address.";
    }
    return "";
  }

  function goNext() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(""); setDir(1); setStep((s) => Math.min(2, s + 1));
  }
  function goBack() { setError(""); setDir(-1); setStep((s) => Math.max(1, s - 1)); }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setSaving(true); setError("");

    const validPhones = phones.filter((p) => p.trim());
    const body = {
      name:        form.name,
      slug:        form.slug,
      area:        lc(form.area),
      category:    form.category.trim(),
      description: form.description,
      memberSince: form.memberSince,
      email:       form.email,
      website:     form.website,
      facebook:    form.facebook,
      instagram:   form.instagram,
      youtube:     form.youtube,
      image:       form.image,
      featured:    form.featured,
      phones:      validPhones,           // new phones array
      phone:       validPhones.join(", "), // legacy field for backward compat
      showPhone,
      showEmail,
      // Billing — only sent for new member
      ...(!member && {
        memberCategoryId: memberCategoryId || null,
        billingOption,
      }),
    };

    const url    = member ? `/api/members/${member.id}` : "/api/members";
    const method = member ? "PUT" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    if (!res.ok) {
      let msg = "Failed to save. Please try again.";
      try { const e = await res.json() as { error?: string }; msg = e.error ?? msg; } catch { /* empty */ }
      setError(msg);
      setSaving(false);
      return;
    }
    router.push("/admin/members");
    router.refresh();
  }

  // ── Sub-components ──────────────────────────────────────────────────────────
  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition";

  const stepVariants = {
    enter:  (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  // ── Incomplete profile notice (edit mode only) ──────────────────────────────
  const incompleteFields = member ? [
    !member.phone       && "Phone number",
    !member.email       && "Email address",
    !member.description && "Bio",
    !member.image       && "Photo",
    !member.category    && "Profession",
  ].filter(Boolean) as string[] : [];

  return (
    <div className="max-w-2xl">
      {/* ── Incomplete profile notice ──────────────────────────────────────── */}
      {incompleteFields.length > 0 && (
        <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
          <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">
              Incomplete profile — {incompleteFields.length} field{incompleteFields.length !== 1 ? "s" : ""} missing
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Missing: {incompleteFields.join(", ")}. Complete these to improve this member&apos;s public profile.
            </p>
          </div>
        </div>
      )}

      {/* ── Progress bar ─────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => {
            const done = step > s.id; const cur = step === s.id; const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    animate={{ backgroundColor: done ? "#10b981" : cur ? "#f59e0b" : "#e5e7eb", scale: cur ? 1.15 : 1 }}
                    transition={{ duration: 0.25 }}
                    className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm">
                    {done ? <Check size={16} className="text-white" strokeWidth={2.5} /> : <Icon size={16} className={cur ? "text-white" : "text-gray-400"} />}
                  </motion.div>
                  <span className={`text-[10px] font-medium hidden sm:block ${cur ? "text-amber-600" : done ? "text-emerald-600" : "text-gray-400"}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 mx-2 h-0.5 rounded-full overflow-hidden bg-gray-200 mb-4">
                    <motion.div animate={{ width: step > s.id ? "100%" : "0%" }} transition={{ duration: 0.4 }}
                      className="h-full bg-emerald-400 rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 text-center">Step {step} of {STEPS.length} — {STEPS[step - 1].hint}</p>
      </div>

      {/* ── Card ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          {(() => { const Icon = STEPS[step - 1].icon; return <div className="p-2 bg-amber-50 rounded-xl"><Icon size={18} className="text-amber-600" /></div>; })()}
          <div>
            <h2 className="font-bold text-gray-900">{STEPS[step - 1].label}</h2>
            <p className="text-xs text-gray-400">{STEPS[step - 1].hint}</p>
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={stepVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="px-6 py-6 space-y-5">

            {/* ── STEP 1 — Basic Info ───────────────────────────────────────── */}
            {step === 1 && (<>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sunita Sharma" required className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  URL Slug * <span title="Auto-filled from name. Used in the public URL." className="inline-flex text-gray-400 cursor-help ml-0.5"><Info size={12} /></span>
                </label>
                <div className="flex items-center gap-0">
                  <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 border-r-0 rounded-l-xl px-3 py-2.5 whitespace-nowrap">members/</span>
                  <input value={form.slug} onChange={(e) => set("slug", e.target.value)} required
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Lowercase letters, numbers, and hyphens only.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Profession</label>
                <input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Lawyer, Architect, Consultant" className={inputCls} />
                <p className="text-[11px] text-gray-400 mt-1">Shown as a badge on the public member card.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Location *</label>
                <input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Kathmandu, Lalitpur" required className={inputCls} />
                <p className="text-[11px] text-gray-400 mt-1">Used as the location filter on the public members page.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4}
                  placeholder="A short bio — background, experience, focus areas…"
                  className={`${inputCls} resize-none`} />
                <p className="text-[11px] text-gray-400 mt-1">Shown on the public profile page.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Member Since (Year)</label>
                <input type="number" min={1900} max={2200} value={form.memberSince}
                  onChange={(e) => set("memberSince", e.target.value)}
                  placeholder="e.g. 2020" className={inputCls} />
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-amber-300 transition-colors">
                <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="w-4 h-4 rounded" />
                <div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-700"><Star size={13} className="text-amber-500" /> Featured Member</div>
                  <p className="text-[11px] text-gray-400">Highlighted on the homepage member showcase</p>
                </div>
              </label>
            </>)}

            {/* ── STEP 2 — Contact ──────────────────────────────────────────── */}
            {step === 2 && (<>
              {/* Phones */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Numbers</label>
                <p className="text-[11px] text-gray-400 mb-2">Nepali mobile: 98XXXXXXXX (10 digits). Landline: 01XXXXXXX or 061XXXXXX.</p>
                <div className="space-y-2">
                  {phones.map((p, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input type="tel" value={p} onChange={(e) => setPhone(i, e.target.value)}
                          placeholder={i === 0 ? "Primary number, e.g. 9851234567" : "Additional number"}
                          className={`${inputCls} ${phoneErrors[i] ? "border-red-300 bg-red-50 focus:ring-red-400" : ""}`} />
                        {phoneErrors[i] && <p className="text-[11px] text-red-500 mt-0.5">Invalid. Mobile: 10 digits starting 96/97/98. Landline: starts with 0.</p>}
                        {p && !phoneErrors[i] && isValidNepaliPhone(p) && <p className="text-[11px] text-emerald-600 mt-0.5">✓ Valid Nepali number</p>}
                      </div>
                      {phones.length > 1 && (
                        <button type="button" onClick={() => removePhone(i)}
                          className="mt-1.5 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><X size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addPhone}
                  className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium py-1">
                  <Plus size={13} /> Add another number
                </button>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                    placeholder="name@example.com"
                    className={`${inputCls} pl-9 ${form.email && !isValidEmail(form.email) ? "border-red-300 bg-red-50" : ""}`} />
                </div>
                {form.email && !isValidEmail(form.email) && <p className="text-[11px] text-red-500 mt-0.5">Please enter a valid email address.</p>}
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Website</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.website} onChange={(e) => set("website", e.target.value)}
                    placeholder="www.example.com" className={`${inputCls} pl-9`} />
                </div>
              </div>

              {/* Public visibility toggles — only meaningful in edit mode */}
              {member && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Public Visibility</p>
                  <p className="text-[11px] text-gray-400 mb-3">Control what contact info appears on the public member profile.</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-amber-300 transition-colors">
                      <input type="checkbox" checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} className="w-4 h-4 rounded" />
                      <div>
                        <div className="text-sm font-semibold text-gray-700">Show phone number publicly</div>
                        <p className="text-[11px] text-gray-400">Visitors can see and call the phone number on the public profile</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-amber-300 transition-colors">
                      <input type="checkbox" checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} className="w-4 h-4 rounded" />
                      <div>
                        <div className="text-sm font-semibold text-gray-700">Show email address publicly</div>
                        <p className="text-[11px] text-gray-400">Visitors can see the email address on the public profile</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Social media */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-3">Social Media <span className="text-gray-400 font-normal text-xs">(optional)</span></p>
                <div className="space-y-3">
                  {[
                    { icon: <Facebook size={14} className="text-blue-500" />, key: "facebook", placeholder: "e.g. facebook.com/yourname or just: yourname" },
                    { icon: <Instagram size={14} className="text-pink-500" />, key: "instagram", placeholder: "e.g. instagram.com/yourname or just: yourname" },
                    { icon: <Youtube size={14} className="text-red-500" />, key: "youtube", placeholder: "e.g. youtube.com/@yourname or just: @yourname" },
                  ].map(({ icon, key, placeholder }) => (
                    <div key={key} className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
                      <input type="text" value={form[key as keyof typeof form] as string}
                        onChange={(e) => set(key, e.target.value)} placeholder={placeholder}
                        className={`${inputCls} pl-9`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Photo */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Photo</label>
                <p className="text-[11px] text-gray-400 mb-2">Shown on the member card and profile page.</p>
                <ImageUpload value={form.image} onChange={(url) => set("image", url)} />
              </div>

              {/* ── Membership Billing (new member only) ─────────────────── */}
              {!member && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <Receipt size={14} className="text-indigo-500" />
                    <span className="text-sm font-semibold text-gray-700">Membership Billing</span>
                    <span className="text-xs text-gray-400 ml-1">(optional)</span>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Membership Category</label>
                      {memberCategories.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No fee categories set up yet. <a href="/admin/membership/categories" className="text-indigo-500 underline">Add one first</a>.</p>
                      ) : (
                        <select
                          value={memberCategoryId}
                          onChange={(e) => setMemberCategoryId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                          <option value="">— No category / skip billing —</option>
                          {memberCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} — Rs. {Number(c.annualRenewalFee).toLocaleString()}/yr
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {memberCategoryId && (() => {
                      const cat = memberCategories.find((c) => c.id === memberCategoryId);
                      const fee = cat ? Number(cat.annualRenewalFee) : 0;
                      return (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500">
                            Annual fee: <span className="font-semibold text-gray-800">Rs. {fee.toLocaleString()}</span>
                          </p>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Billing action</label>
                          {([
                            { value: "pending", label: "Set as pending due", desc: `Create an unpaid due for Rs. ${fee.toLocaleString()} — to be collected` },
                            { value: "paid",    label: "Already paid",        desc: `Record as paid now — you can add receipt/method details later` },
                            { value: "none",    label: "Skip billing for now", desc: "Assign category only — no dues record created" },
                          ] as { value: BillingOption; label: string; desc: string }[]).map((opt) => (
                            <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${billingOption === opt.value ? "border-indigo-300 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                              <input
                                type="radio"
                                name="billingOption"
                                value={opt.value}
                                checked={billingOption === opt.value}
                                onChange={() => setBillingOption(opt.value)}
                                className="mt-0.5 flex-shrink-0"
                              />
                              <div>
                                <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                                <p className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Summary review */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Review Before Saving</p>
                <div className="space-y-2">
                  {([
                    ["Name",         form.name],
                    ["Profession",   form.category || "—"],
                    ["Location",     form.area],
                    ["Phone(s)",     phones.filter(Boolean).join(", ") || "—"],
                    ["Email",        form.email || "—"],
                    ["Member Since", form.memberSince || "—"],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-gray-400">{label}</span>
                      <span className="font-medium text-gray-700 text-right max-w-[60%] truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>)}

          </motion.div>
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex gap-2">
            <Info size={14} className="flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {/* Footer nav */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button type="button" onClick={goBack} disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft size={15} /> Back
          </button>
          <span className="text-xs text-gray-400">{step}/{STEPS.length}</span>
          {step < 2 ? (
            <button type="button" onClick={goNext}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#0a1040] text-white text-sm font-medium rounded-lg hover:bg-[#0d1550] shadow-sm transition-colors">
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={15} /> {member ? "Update Member" : "Save Member"}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
