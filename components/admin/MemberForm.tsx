"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Member } from "@prisma/client";
import ImageUpload from "./ImageUpload";
import MapPicker from "./MapPicker";
import {
  Building2, MapPin, Tag, Phone, Image as ImageIcon,
  ChevronRight, ChevronLeft, Check, Info, Plus, X,
  Facebook, Instagram, Youtube, Globe, Mail, Star,
  Sparkles, Loader2, Navigation,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Banquet Hall", "Party Palace", "Hotel Banquet", "Garden Venue",
  "Rooftop Venue", "Conference Hall", "Restaurant Banquet",
  "Community Hall", "Resort Venue", "Cultural Hall", "Other",
];
const TYPES = ["Indoor", "Outdoor", "Indoor & Outdoor", "Rooftop", "Pool Side"];
const AMENITIES = [
  "AC Hall", "Free Parking", "Paid Parking", "In-house Catering",
  "Outside Catering Allowed", "Decoration Service", "DJ / Sound System",
  "Live Band Space", "Generator Backup", "CCTV", "WiFi", "Bridal Room",
  "Stage", "Dance Floor", "Bar Service", "Valet Parking", "Lift / Elevator",
  "Wheelchair Access", "Outdoor Garden", "Swimming Pool", "Guest Rooms",
  "Conference Room", "Projector / Screen", "Photo / Video Service",
  "Tent / Canopy Setup", "Sufficient Lighting",
];
const STEPS = [
  { id: 1, label: "Venue Basics",  icon: Building2, hint: "Name, slug, and membership year" },
  { id: 2, label: "Location",      icon: MapPin,    hint: "Address and map pin" },
  { id: 3, label: "Venue Profile", icon: Tag,       hint: "Category, type, and description" },
  { id: 4, label: "Contact",       icon: Phone,     hint: "Phones, email, and social media" },
  { id: 5, label: "Amenities",     icon: ImageIcon, hint: "Features, photo, and review" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidNepaliPhone(v: string) {
  return /^(9[6-8]\d{8}|0[1-9]\d{5,7})$/.test(v.replace(/[\s\-\(\)]/g, ""));
}
function isValidEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function adToBS(ad: number) { const b = ad + 56; return `~${b}/${b + 1} BS`; }
function bsToAD(bs: number) { return bs - 57; }
function lc(s: string) { return s.toLowerCase().trim(); }

// ─── Auto-description generator ───────────────────────────────────────────────

function buildDescription(params: {
  name: string; area: string; capacity: string;
  cats: Set<string>; types: Set<string>; amenities: Set<string>; memberSince: string;
}): string {
  const { name, area, capacity, cats, types, amenities, memberSince } = params;
  const capN  = capacity ? Number(capacity) : null;
  const capTx = capN ? `accommodate up to ${capN.toLocaleString()} guests` : "welcome guests of all group sizes";
  const catTx = cats.size ? Array.from(cats).join(" and ") : "event venue";
  const typTx = types.size ? ` ${Array.from(types).join(" and ").toLowerCase()} ` : " ";
  const top3  = Array.from(amenities).slice(0, 3).map((a) => a.toLowerCase());
  const amTx  = top3.length >= 2 ? `${top3.slice(0, -1).join(", ")} and ${top3[top3.length - 1]}` : top3[0] ?? "";
  const since = memberSince ? ` since ${memberSince}` : "";

  const variants = [
    `${name} is a premier${typTx}${catTx} located in ${area}, Kathmandu Valley. The venue can ${capTx}, making it an ideal choice for weddings, corporate events, and social celebrations. ${amTx ? `The venue features ${amTx} among its many amenities.` : ""} As a proud member of EVA Nepal${since}, ${name} is dedicated to delivering exceptional event experiences.`,

    `Situated in ${area}, ${name} is one of Kathmandu Valley's trusted${typTx}${catTx}s. With a capacity to ${capTx}, the venue is perfectly suited for ceremonies, receptions, and large gatherings. ${amTx ? `Guests can enjoy ${amTx} and a range of other modern facilities.` : ""} ${name} has been a registered EVA Nepal member${since}.`,

    `Nestled in the heart of ${area}, ${name} offers an elegant${typTx}setting for all kinds of events. The venue comfortably ${capTx} and is renowned as a leading ${catTx} in the valley. ${amTx ? `Notable amenities include ${amTx}.` : ""} With its commitment to quality service, ${name} continues to be a preferred choice for memorable celebrations${since ? ` — a proud EVA member${since}` : ""}.`,

    `${name}, based in ${area}, is a well-established${typTx}${catTx} known for hosting memorable events across Kathmandu Valley. The venue can ${capTx} and offers an excellent environment for everything from intimate gatherings to large-scale celebrations. ${amTx ? `Key features include ${amTx}.` : ""} ${since ? `A proud member of EVA Nepal${since}.` : ""}`,
  ];

  return variants[Math.floor(Math.random() * variants.length)];
}

// ─── Nominatim geocoder (OpenStreetMap, free, no API key) ─────────────────────

interface NominatimResult { place_id: number; display_name: string; lat: string; lon: string; }

async function geocode(query: string): Promise<NominatimResult[]> {
  const q = `${query}, Nepal`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=np`;
  const res = await fetch(url, { headers: { "User-Agent": "EVA-Nepal-Admin/1.0 (evanepal.org)" } });
  if (!res.ok) throw new Error("Geocoding failed");
  return res.json() as Promise<NominatimResult[]>;
}

// ─── Component ────────────────────────────────────────────────────────────────

type MemberExt = Member;
interface Props { member?: MemberExt }

export default function MemberForm({ member }: Props) {
  const router = useRouter();
  const [step,      setStep]      = useState(1);
  const [dir,       setDir]       = useState(1);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [yearMode,  setYearMode]  = useState<"AD" | "BS">("AD");

  const [genLoading, setGenLoading] = useState(false);

  // Geocoding state
  const [geoLoading,  setGeoLoading]  = useState(false);
  const [geoResults,  setGeoResults]  = useState<NominatimResult[]>([]);
  const [geoError,    setGeoError]    = useState("");
  const [mapPreview,  setMapPreview]  = useState<{ lat: number; lng: number } | null>(
    member?.latitude && member?.longitude ? { lat: member.latitude, lng: member.longitude } : null
  );

  const parseMulti = (v: string | null | undefined) =>
    v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const [form, setForm] = useState({
    name:        member?.name        ?? "",
    slug:        member?.slug        ?? "",
    area:        member?.area        ?? "",
    location:    member?.location    ?? "",
    capacity:    String(member?.capacity ?? ""),
    description: member?.description ?? "",
    memberSince: member?.memberSince ?? "",
    email:       member?.email       ?? "",
    website:     member?.website     ?? "",
    facebook:    member?.facebook    ?? "",
    instagram:   member?.instagram   ?? "",
    youtube:     member?.youtube     ?? "",
    image:       member?.image       ?? "",
    featured:    member?.featured    ?? false,
    latitude:    String(member?.latitude  ?? ""),
    longitude:   String(member?.longitude ?? ""),
  });

  const [phones,      setPhones]      = useState<string[]>(parseMulti(member?.phone).length ? parseMulti(member?.phone) : [""]);
  const [phoneErrors, setPhoneErrors] = useState<boolean[]>(phones.map(() => false));
  const [categories,  setCategories]  = useState<Set<string>>(new Set(parseMulti(member?.category)));
  const [types,       setTypes]       = useState<Set<string>>(new Set(parseMulti(member?.type)));
  const [amenities,   setAmenities]   = useState<Set<string>>(new Set(member?.amenities ?? []));

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
  function toggle<T>(s: Set<T>, setS: React.Dispatch<React.SetStateAction<Set<T>>>, v: T) {
    setS((prev) => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n; });
  }

  // ── Geocode handler ──────────────────────────────────────────────────────────
  async function handleGeocode() {
    const addr = form.location.trim() || form.area.trim();
    if (!addr) { setGeoError("Please enter an area or address first."); return; }
    setGeoLoading(true); setGeoError(""); setGeoResults([]);
    try {
      // Pass 1: venue name + address (like Google Maps search)
      const q1 = [form.name.trim(), addr].filter(Boolean).join(", ");
      let results = await geocode(q1);
      // Pass 2: address only (OSM often lacks Nepal business listings)
      if (results.length === 0) results = await geocode(addr);
      if (results.length === 0) { setGeoError("Location not found. Try entering a nearby landmark or neighbourhood in the Full Address field."); }
      else setGeoResults(results);
    } catch { setGeoError("Could not reach location service. Please enter coordinates manually."); }
    setGeoLoading(false);
  }

  function pickGeoResult(r: NominatimResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setForm((p) => ({ ...p, latitude: r.lat, longitude: r.lon }));
    setMapPreview({ lat, lng });
    setGeoResults([]);
  }

  // ── Description generator ───────────────────────────────────────────────────
  function handleGenerate() {
    setGenLoading(true);
    setTimeout(() => {
      const desc = buildDescription({
        name: form.name, area: form.area, capacity: form.capacity,
        cats: categories, types, amenities, memberSince: form.memberSince,
      });
      set("description", desc);
      setGenLoading(false);
    }, 400);
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateStep(s: number): string {
    if (s === 1 && !form.name.trim()) return "Venue name is required.";
    if (s === 1 && !form.slug.trim()) return "Slug is required.";
    if (s === 2 && !form.area.trim()) return "Area / neighbourhood is required.";
    if (s === 2 && form.capacity && isNaN(Number(form.capacity))) return "Capacity must be a whole number.";
    if (s === 2 && form.capacity && Number(form.capacity) < 1) return "Capacity must be at least 1.";
    if (s === 4) {
      const bad = phones.filter((p) => p.trim()).filter((p) => !isValidNepaliPhone(p));
      if (bad.length) return "One or more phone numbers are invalid. Use 98XXXXXXXX or 01XXXXXXX format.";
      if (form.email && !isValidEmail(form.email)) return "Please enter a valid email address.";
    }
    return "";
  }

  function goNext() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(""); setDir(1); setStep((s) => Math.min(5, s + 1));
  }
  function goBack() { setError(""); setDir(-1); setStep((s) => Math.max(1, s - 1)); }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setSaving(true); setError("");

    const body = {
      ...form,
      // Normalize to lowercase for consistent storage
      area:      lc(form.area),
      location:  lc(form.location),
      capacity:  form.capacity ? Number(form.capacity) : null,
      latitude:  form.latitude  ? parseFloat(form.latitude)  : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      phone:     phones.filter((p) => p.trim()).join(", "),
      category:  Array.from(categories).map(lc).join(", "),
      type:      Array.from(types).map(lc).join(", "),
      amenities: Array.from(amenities).map(lc),
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

  // ── Derived ─────────────────────────────────────────────────────────────────
  const adYear = Number(form.memberSince);
  const bsHint = form.memberSince && !isNaN(adYear)
    ? (yearMode === "AD" ? adToBS(adYear) : `≈ ${adYear} AD`) : null;



  // ── Sub-components ──────────────────────────────────────────────────────────
  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition";

  const CheckCard = ({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) => (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all select-none text-left
        ${checked ? "bg-amber-50 border-amber-400 text-amber-800 font-medium shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:border-amber-300"}`}>
      <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors
        ${checked ? "bg-amber-500 border-amber-500" : "border-gray-300"}`}>
        {checked && <Check size={10} className="text-white" strokeWidth={3} />}
      </span>
      {label}
    </button>
  );

  const stepVariants = {
    enter:  (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div className="max-w-2xl">
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

            {/* ── STEP 1 ─────────────────────────────────────────────────────── */}
            {step === 1 && (<>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Start with the official name of the venue — exactly as it should appear on the public directory.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Venue Name *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Hotel Annapurna Banquet" required className={inputCls} />
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

              {/* Member Since with BS/AD */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Member Since (Year)</label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input type="number" min={1900} max={2200} value={form.memberSince}
                      onChange={(e) => {
                        const val = e.target.value;
                        set("memberSince", yearMode === "BS" && val ? String(bsToAD(Number(val))) : val);
                      }}
                      placeholder={yearMode === "AD" ? "e.g. 2011" : "e.g. 2068"} className={inputCls} />
                    {bsHint && <p className="text-[11px] text-emerald-600 mt-1 font-medium">{yearMode === "AD" ? `Equivalent: ${bsHint}` : `Stored as: ${form.memberSince} AD`}</p>}
                  </div>
                  <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5 flex-shrink-0">
                    {(["AD", "BS"] as const).map((m) => (
                      <button key={m} type="button" onClick={() => setYearMode(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${yearMode === m ? "bg-white shadow-sm text-amber-600" : "text-gray-400 hover:text-gray-600"}`}>{m}</button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Toggle AD/BS to enter in either calendar. We always store the AD (English) year.</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-amber-300 transition-colors">
                <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="w-4 h-4 rounded" />
                <div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-700"><Star size={13} className="text-amber-500" /> Featured Venue</div>
                  <p className="text-[11px] text-gray-400">Highlighted on the homepage member showcase</p>
                </div>
              </label>
            </>)}

            {/* ── STEP 2 ─────────────────────────────────────────────────────── */}
            {step === 2 && (<>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">The area is used for filtering on the public directory. Be specific — use the neighbourhood name (e.g. Baneshwor, Teku) not just &quot;Kathmandu&quot;.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Area / Neighbourhood *</label>
                <input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Baneshwor, Teku, Lalitpur" required className={inputCls} />
                <p className="text-[11px] text-gray-400 mt-1">Used as the area filter on the public members page.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Address</label>
                <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Baneshwor Chowk, Kathmandu 44600" className={inputCls} />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Guest Capacity</label>
                <div className="relative">
                  <input type="number" min={1} value={form.capacity}
                    onChange={(e) => { const v = e.target.value; if (v === "" || Number(v) >= 1) set("capacity", v); }}
                    placeholder="e.g. 500" className={`${inputCls} pr-16`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">guests</span>
                </div>
                {form.capacity && Number(form.capacity) >= 1000 && <p className="text-[11px] text-amber-600 mt-0.5 font-medium">★ Grand tier (1000+ guests)</p>}
                {form.capacity && Number(form.capacity) >= 700 && Number(form.capacity) < 1000 && <p className="text-[11px] text-blue-600 mt-0.5 font-medium">● Large tier (700–999 guests)</p>}
                {form.capacity && Number(form.capacity) >= 400 && Number(form.capacity) < 700 && <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">● Medium tier (400–699 guests)</p>}
                {form.capacity && Number(form.capacity) > 0 && Number(form.capacity) < 400 && <p className="text-[11px] text-purple-600 mt-0.5 font-medium">● Intimate tier (under 400 guests)</p>}
              </div>

              {/* Map pin ─────────────────────────────────────────────────────── */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Map Location</label>
                    <p className="text-[11px] text-gray-400">Used to show directions on the venue profile page. Completely free — no Google account needed.</p>
                  </div>
                  <button type="button" onClick={handleGeocode} disabled={geoLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0 ml-3">
                    {geoLoading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                    {geoLoading ? "Locating…" : "Find on Map"}
                  </button>
                </div>

                {geoError && <p className="text-xs text-red-500 mb-2">{geoError}</p>}

                {/* Geocoding results */}
                {geoResults.length > 0 && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                    <p className="text-xs text-gray-500 px-3 py-2 bg-gray-50 border-b border-gray-100">Select the correct location:</p>
                    {geoResults.map((r) => (
                      <button key={r.place_id} type="button" onClick={() => pickGeoResult(r)}
                        className="w-full text-left px-3 py-2.5 text-xs text-gray-700 hover:bg-amber-50 border-b border-gray-50 last:border-0 transition-colors">
                        <span className="font-medium text-gray-900 block truncate">{r.display_name}</span>
                        <span className="text-gray-400">{parseFloat(r.lat).toFixed(6)}, {parseFloat(r.lon).toFixed(6)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Interactive map picker */}
                {mapPreview && (
                  <div className="mb-3">
                    <MapPicker
                      lat={mapPreview.lat}
                      lng={mapPreview.lng}
                      onPick={(lat, lng) => {
                        setMapPreview({ lat, lng });
                        setForm((p) => ({ ...p, latitude: String(lat), longitude: String(lng) }));
                      }}
                    />
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-600 font-medium">✓ Pinned — {mapPreview.lat.toFixed(5)}, {mapPreview.lng.toFixed(5)}</span>
                      <button type="button" onClick={() => { setMapPreview(null); set("latitude", ""); set("longitude", ""); }}
                        className="text-[11px] text-red-400 hover:text-red-600">Remove pin</button>
                    </div>
                  </div>
                )}

                {/* Manual override */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none">Enter coordinates manually</summary>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">Latitude</label>
                      <input type="number" step="any" value={form.latitude} onChange={(e) => {
                        set("latitude", e.target.value);
                        if (e.target.value && form.longitude) setMapPreview({ lat: parseFloat(e.target.value), lng: parseFloat(form.longitude) });
                      }} placeholder="e.g. 27.7069" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">Longitude</label>
                      <input type="number" step="any" value={form.longitude} onChange={(e) => {
                        set("longitude", e.target.value);
                        if (form.latitude && e.target.value) setMapPreview({ lat: parseFloat(form.latitude), lng: parseFloat(e.target.value) });
                      }} placeholder="e.g. 85.3157" className={inputCls} />
                    </div>
                  </div>
                </details>
              </div>
            </>)}

            {/* ── STEP 3 ─────────────────────────────────────────────────────── */}
            {step === 3 && (<>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Venue Category <span className="text-gray-400 font-normal text-xs">(select all that apply)</span>
                </label>
                <p className="text-[11px] text-gray-400 mb-2">Shown as a badge on the member card. Choose the best fit for this venue.</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => <CheckCard key={c} label={c} checked={categories.has(c)} onClick={() => toggle(categories, setCategories, c)} />)}
                </div>
                {categories.size > 0 && <p className="text-[11px] text-amber-600 mt-2">{categories.size} selected: {Array.from(categories).join(", ")}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Venue Type / Setting <span className="text-gray-400 font-normal text-xs">(select all that apply)</span>
                </label>
                <p className="text-[11px] text-gray-400 mb-2">Whether the space is indoors, outdoors, or both.</p>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => <CheckCard key={t} label={t} checked={types.has(t)} onClick={() => toggle(types, setTypes, t)} />)}
                </div>
              </div>

              {/* Description with AI-style generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-semibold text-gray-700">About This Venue</label>
                  <button type="button" onClick={handleGenerate} disabled={genLoading || !form.name}
                    title={!form.name ? "Enter venue name first (Step 1)" : "Auto-generate a description from the information entered so far"}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-40 transition-colors">
                    {genLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    {genLoading ? "Generating…" : "Auto-Generate"}
                  </button>
                </div>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5}
                  placeholder="Describe what makes this venue special — or click Auto-Generate to create one from the information you&apos;ve already entered…"
                  className={`${inputCls} resize-none`} />
                <p className="text-[11px] text-gray-400 mt-1">Shown on the public venue profile page. You can edit the generated text.</p>
              </div>
            </>)}

            {/* ── STEP 4 ─────────────────────────────────────────────────────── */}
            {step === 4 && (<>
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
                    placeholder="venue@example.com"
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
                    placeholder="www.venuename.com.np" className={`${inputCls} pl-9`} />
                </div>
              </div>

              {/* Social media */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-3">Social Media <span className="text-gray-400 font-normal text-xs">(optional)</span></p>
                <div className="space-y-3">
                  {[
                    { icon: <Facebook size={14} className="text-blue-500" />, key: "facebook", placeholder: "e.g. facebook.com/evanepal or just: evanepal" },
                    { icon: <Instagram size={14} className="text-pink-500" />, key: "instagram", placeholder: "e.g. instagram.com/evanepal or just: evanepal" },
                    { icon: <Youtube size={14} className="text-red-500" />, key: "youtube", placeholder: "e.g. youtube.com/@evanepal or just: @evanepal" },
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
            </>)}

            {/* ── STEP 5 ─────────────────────────────────────────────────────── */}
            {step === 5 && (<>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Amenities & Features</label>
                <p className="text-[11px] text-gray-400 mb-3">Tick everything this venue provides. This helps people find the right venue.</p>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITIES.map((a) => <CheckCard key={a} label={a} checked={amenities.has(a)} onClick={() => toggle(amenities, setAmenities, a)} />)}
                </div>
                {amenities.size > 0 && <p className="text-[11px] text-amber-600 mt-2">{amenities.size} feature{amenities.size !== 1 ? "s" : ""} selected</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Venue Photo / Logo</label>
                <p className="text-[11px] text-gray-400 mb-2">Upload a photo or logo. Shown on the member card and profile page.</p>
                <ImageUpload value={form.image} onChange={(url) => set("image", url)} />
              </div>

              {/* Summary review */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Review Before Saving</p>
                <div className="space-y-2">
                  {([
                    ["Venue Name",  form.name],
                    ["Area",        form.area],
                    ["Capacity",    form.capacity ? `${form.capacity} guests` : "—"],
                    ["Category",    Array.from(categories).join(", ") || "—"],
                    ["Type",        Array.from(types).join(", ") || "—"],
                    ["Phone(s)",    phones.filter(Boolean).join(", ") || "—"],
                    ["Email",       form.email || "—"],
                    ["Member Since",form.memberSince || "—"],
                    ["Map Pin",     mapPreview ? `${mapPreview.lat.toFixed(4)}, ${mapPreview.lng.toFixed(4)}` : "Not set"],
                    ["Amenities",   amenities.size ? `${amenities.size} selected` : "—"],
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
          {step < 5 ? (
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
