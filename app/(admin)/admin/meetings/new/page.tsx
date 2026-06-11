"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, Calendar, MapPin,
  FileText, Users, Presentation, PartyPopper,
  ClipboardList, Star, AlertCircle, Navigation,
  Loader2, Sparkles,
} from "lucide-react";

// MapPicker loaded client-side only (Leaflet needs browser)
const MapPicker = dynamic(() => import("@/components/admin/MapPicker"), { ssr: false });

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPES = [
  {
    value: "agm",
    full: "Annual General Meeting",
    icon: Presentation,
    desc: "Yearly gathering of all members to review the year, elect committee, and pass resolutions.",
  },
  {
    value: "committee",
    full: "Committee Meeting",
    icon: Users,
    desc: "Internal meeting of the executive committee to discuss operations and decisions.",
  },
  {
    value: "program",
    full: "Program / Event",
    icon: Star,
    desc: "Association-organized program, workshop, seminar, or external event.",
  },
  {
    value: "picnic",
    full: "Picnic / Recreation",
    icon: PartyPopper,
    desc: "Member recreation, team outing, or informal gathering.",
  },
  {
    value: "special",
    full: "Special Meeting",
    icon: ClipboardList,
    desc: "Ad-hoc or emergency meeting called outside the regular schedule.",
  },
];

const STEPS = [
  { id: 1, label: "Meeting Identity",    hint: "Name and type of meeting" },
  { id: 2, label: "Schedule & Location", hint: "When and where it happens" },
  { id: 3, label: "Review & Create",     hint: "Confirm before saving" },
];

// Default map centre — Kathmandu
const DEFAULT_LAT = 27.7172;
const DEFAULT_LNG = 85.3240;

// ─── Nominatim geocoding ──────────────────────────────────────────────────────

interface NominatimResult { place_id: number; display_name: string; lat: string; lon: string; }

async function geocode(query: string): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", Nepal")}&format=json&limit=5&countrycodes=np`;
  const res = await fetch(url, { headers: { "User-Agent": "EVA-Nepal-Admin/1.0 (evanepal.org)" } });
  if (!res.ok) throw new Error("Geocoding failed");
  return res.json() as Promise<NominatimResult[]>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPreviewDate(val: string) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function slideVariants(dir: number) {
  return {
    initial:  { opacity: 0, x: dir > 0 ? 40 : -40 },
    animate:  { opacity: 1, x: 0 },
    exit:     { opacity: 0, x: dir > 0 ? -40 : 40 },
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewMeetingPage() {
  const router = useRouter();
  const [step,   setStep]   = useState(1);
  const [dir,    setDir]    = useState(1);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [descLoading, setDescLoading] = useState(false);

  const [form, setForm] = useState({
    title:       "",
    type:        "agm",
    scheduledAt: "",
    venue:       "",
    description: "",
    latitude:    "",
    longitude:   "",
  });

  // Geocoding state
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoResults, setGeoResults] = useState<NominatimResult[]>([]);
  const [geoError,   setGeoError]   = useState("");
  const [mapPreview, setMapPreview] = useState<{ lat: number; lng: number } | null>(null);

  function set(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
    if (k !== "latitude" && k !== "longitude") setError("");
  }

  // ── Geocode handler ──────────────────────────────────────────────────────────
  async function handleGeocode() {
    const addr = form.venue.trim();
    if (!addr) { setGeoError("Please enter a venue name or address first."); return; }
    setGeoLoading(true); setGeoError(""); setGeoResults([]);
    try {
      // Pass 1: venue name only
      let results = await geocode(addr);
      // Pass 2: append Kathmandu for context
      if (results.length === 0) results = await geocode(`${addr}, Kathmandu`);
      if (results.length === 0) {
        setGeoError("Location not found. Try a nearby landmark, street name, or enter coordinates manually.");
      } else {
        setGeoResults(results);
      }
    } catch {
      setGeoError("Could not reach location service. Please enter coordinates manually.");
    }
    setGeoLoading(false);
  }

  function pickGeoResult(r: NominatimResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setForm((p) => ({ ...p, latitude: r.lat, longitude: r.lon }));
    setMapPreview({ lat, lng });
    setGeoResults([]);
    setGeoError("");
  }

  // ── AI description ───────────────────────────────────────────────────────────
  async function generateDescription() {
    if (!form.title.trim()) return;
    setDescLoading(true);
    try {
      const res  = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "meeting", title: form.title, meetingType: form.type, venue: form.venue }),
      });
      const json = await res.json() as { success: boolean; data?: { text: string }; error?: string };
      if (json.success && json.data?.text) {
        setForm((p) => ({ ...p, description: json.data!.text }));
      }
    } catch { /* silent — user can type manually */ }
    setDescLoading(false);
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateStep(s: number): string {
    if (s === 1) {
      if (!form.title.trim()) return "Meeting title is required.";
      if (form.title.trim().length < 3) return "Title must be at least 3 characters.";
    }
    if (s === 2) {
      if (!form.scheduledAt) return "Please select a date and time for the meeting.";
      if (isNaN(new Date(form.scheduledAt).getTime())) return "Invalid date/time value.";
    }
    return "";
  }

  function goNext() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(""); setDir(1); setStep((s) => Math.min(3, s + 1));
  }
  function goBack() { setError(""); setDir(-1); setStep((s) => Math.max(1, s - 1)); }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setSaving(true); setError("");
    try {
      const res  = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          latitude:  form.latitude  ? parseFloat(form.latitude)  : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
        }),
      });
      const json = await res.json() as { success: boolean; data?: { id: string }; error?: string };
      if (!json.success) throw new Error(json.error ?? "Failed to create meeting");
      router.push(`/admin/meetings/${json.data!.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const selectedType = TYPES.find((t) => t.value === form.type)!;
  const mapLat = mapPreview?.lat ?? DEFAULT_LAT;
  const mapLng = mapPreview?.lng ?? DEFAULT_LNG;

  return (
    <div className="max-w-2xl">
      {/* Back link */}
      <Link
        href="/admin/meetings"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={13} /> Back to Meetings
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Schedule a Meeting</h1>
      <p className="text-gray-400 text-sm mb-8">Fill in the details below to create a new meeting record.</p>

      {/* ── Step Indicator ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const done   = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done   ? "bg-green-500 text-white" :
                    active ? "bg-[#0a1040] text-white shadow-md" :
                             "bg-gray-100 text-gray-400"
                  }`}
                >
                  {done ? <Check size={13} /> : s.id}
                </div>
                <div className="hidden sm:block">
                  <div className={`text-xs font-semibold ${active ? "text-[#0a1040]" : done ? "text-green-600" : "text-gray-400"}`}>
                    {s.label}
                  </div>
                  <div className="text-xs text-gray-400">{s.hint}</div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 sm:w-12 mx-1 transition-all ${step > s.id ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step Content ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            variants={slideVariants(dir)}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >

            {/* ── STEP 1: Meeting Identity ──────────────────────────────────── */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={18} className="text-[#0a1040]" />
                  <h2 className="text-base font-semibold text-gray-900">Meeting Identity</h2>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Meeting Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="e.g. AGM 2082, Annual Picnic 2025, Q2 Committee Meeting"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/30 focus:border-[#0a1040] transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1.5 flex items-start gap-1">
                    <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
                    Give it a clear, descriptive name. Include the year so it&apos;s easy to find later.
                  </p>
                </div>

                {/* Type — visual cards */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Meeting Type <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TYPES.map((t) => {
                      const Icon    = t.icon;
                      const checked = form.type === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => set("type", t.value)}
                          className={`text-left p-4 rounded-xl border-2 transition-all ${
                            checked
                              ? "border-[#0a1040] bg-[#0a1040]/5 shadow-sm"
                              : "border-gray-100 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon size={16} className={checked ? "text-[#0a1040]" : "text-gray-400"} />
                            <span className={`text-sm font-semibold ${checked ? "text-[#0a1040]" : "text-gray-700"}`}>
                              {t.full}
                            </span>
                            {checked && <Check size={14} className="text-[#0a1040] ml-auto" />}
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">{t.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 flex items-start gap-1">
                    <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
                    Choose the type that best describes this meeting. This helps with filtering and reports.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 2: Schedule & Location ───────────────────────────────── */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={18} className="text-[#0a1040]" />
                  <h2 className="text-base font-semibold text-gray-900">Schedule &amp; Location</h2>
                </div>

                {/* Date & Time */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Date &amp; Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => set("scheduledAt", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/30 focus:border-[#0a1040] transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1.5 flex items-start gap-1">
                    <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
                    Select the scheduled start date and time. You can mark it as Completed or Cancelled later.
                  </p>
                </div>

                {/* Venue name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Venue / Location Name
                  </label>
                  <input
                    type="text"
                    value={form.venue}
                    onChange={(e) => set("venue", e.target.value)}
                    placeholder="e.g. EVA Nepal Office, Hotel Annapurna, Thamel"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/30 focus:border-[#0a1040] transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1.5 flex items-start gap-1">
                    <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
                    Write the venue name and neighbourhood. Leave blank if not yet decided.
                  </p>
                </div>

                {/* ── Map Location ─────────────────────────────────────────────── */}
                <div className="border-t border-gray-100 pt-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Map Location
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Pin the exact meeting spot on the map. Members can use this for directions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGeocode}
                      disabled={geoLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0"
                    >
                      {geoLoading
                        ? <><Loader2 size={12} className="animate-spin" /> Locating…</>
                        : <><Navigation size={12} /> Find on Map</>
                      }
                    </button>
                  </div>

                  {/* Geocode error */}
                  {geoError && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3 flex items-start gap-1.5">
                      <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />{geoError}
                    </p>
                  )}

                  {/* Geocode results list */}
                  {geoResults.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                      <p className="text-xs text-gray-500 px-3 py-2 bg-gray-50 border-b border-gray-100">
                        Select the correct location:
                      </p>
                      {geoResults.map((r) => (
                        <button
                          key={r.place_id}
                          type="button"
                          onClick={() => pickGeoResult(r)}
                          className="w-full text-left px-3 py-2.5 text-xs text-gray-700 hover:bg-[#0a1040]/5 border-b border-gray-50 last:border-0 transition-colors"
                        >
                          <span className="font-medium text-gray-900 block truncate">{r.display_name}</span>
                          <span className="text-gray-400">
                            {parseFloat(r.lat).toFixed(6)}, {parseFloat(r.lon).toFixed(6)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Interactive map */}
                  <div className="mb-3">
                    <MapPicker
                      lat={mapLat}
                      lng={mapLng}
                      onPick={(lat, lng) => {
                        setMapPreview({ lat, lng });
                        setForm((p) => ({ ...p, latitude: String(lat), longitude: String(lng) }));
                      }}
                    />
                    {mapPreview && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <Check size={11} /> Pinned — {mapPreview.lat.toFixed(5)}, {mapPreview.lng.toFixed(5)}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setMapPreview(null); set("latitude", ""); set("longitude", ""); }}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Remove pin
                        </button>
                      </div>
                    )}
                    {!mapPreview && (
                      <p className="text-xs text-gray-400 mt-1.5 flex items-start gap-1">
                        <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
                        Click &quot;Find on Map&quot; to auto-locate, or click directly on the map to place a pin.
                      </p>
                    )}
                  </div>

                  {/* Manual coordinate override */}
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none py-1">
                      Enter coordinates manually
                    </summary>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={form.latitude}
                          onChange={(e) => {
                            set("latitude", e.target.value);
                            if (e.target.value && form.longitude)
                              setMapPreview({ lat: parseFloat(e.target.value), lng: parseFloat(form.longitude) });
                          }}
                          placeholder="e.g. 27.7172"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={form.longitude}
                          onChange={(e) => {
                            set("longitude", e.target.value);
                            if (form.latitude && e.target.value)
                              setMapPreview({ lat: parseFloat(form.latitude), lng: parseFloat(e.target.value) });
                          }}
                          placeholder="e.g. 85.3240"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/30"
                        />
                      </div>
                    </div>
                  </details>
                </div>

                {/* Description */}
                <div className="border-t border-gray-100 pt-5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <FileText size={12} className="text-gray-400" />
                      Description / Notes
                    </span>
                  </label>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Optional but helps members understand the purpose.</span>
                    <button
                      type="button"
                      onClick={generateDescription}
                      disabled={!form.title.trim() || descLoading}
                      title={form.title.trim() ? "Generate a description using AI" : "Enter a meeting title in Step 1 first"}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-violet-50 border border-violet-200 text-violet-700 rounded-lg hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {descLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      {descLoading ? "Generating…" : "AI Generate"}
                    </button>
                  </div>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={4}
                    placeholder="Briefly describe the purpose of this meeting, key topics to cover, or any pre-meeting instructions for members..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/30 focus:border-[#0a1040] transition-all resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1.5 flex items-start gap-1">
                    <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
                    Optional. Visible to admins and portal members. You can add formal agenda items after creating.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 3: Review & Create ───────────────────────────────────── */}
            {step === 3 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <Check size={18} className="text-green-600" />
                  <h2 className="text-base font-semibold text-gray-900">Review &amp; Create</h2>
                </div>
                <p className="text-sm text-gray-400 -mt-2">
                  Please review the details below before creating the meeting.
                </p>

                <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  {[
                    { label: "Title",       value: form.title },
                    { label: "Type",        value: selectedType.full },
                    { label: "Date & Time", value: formatPreviewDate(form.scheduledAt) },
                    { label: "Venue",       value: form.venue || "Not specified" },
                    {
                      label: "Map Pin",
                      value: mapPreview
                        ? `${mapPreview.lat.toFixed(5)}, ${mapPreview.lng.toFixed(5)}`
                        : "Not set",
                    },
                    { label: "Description", value: form.description || "None" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-4 px-5 py-3.5">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-28 flex-shrink-0 mt-0.5">
                        {label}
                      </div>
                      <div className="text-sm text-gray-800 flex-1 leading-relaxed">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 leading-relaxed">
                  After creating, you can add agenda items, record expenses, collect member contributions, and write meeting minutes from the meeting detail page.
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 mt-4 text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-4 py-3"
          >
            <AlertCircle size={13} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-6">
        <div>
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl transition-all hover:border-gray-400"
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <Link
              href="/admin/meetings"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              Cancel
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Step dots */}
          <div className="flex gap-1.5">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all ${
                  step === s.id ? "w-5 bg-[#0a1040]" :
                  step > s.id  ? "w-1.5 bg-green-400" :
                                  "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>

          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a1040] text-white text-sm font-semibold rounded-xl hover:bg-[#0d1550] transition-all shadow-sm"
            >
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a1040] text-white text-sm font-semibold rounded-xl hover:bg-[#0d1550] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                <><Check size={14} /> Create Meeting</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
