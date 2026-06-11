"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Event } from "@prisma/client";
import ImageUpload from "./ImageUpload";
import {
  CalendarDays, MapPin, FileText,
  ChevronRight, ChevronLeft, Check, Info,
  Loader2, Users, GraduationCap, Handshake,
  LayoutGrid, Presentation, Sparkles,
  Navigation, AlertCircle, Clock, RefreshCw,
  Tag, Crosshair, Languages,
} from "lucide-react";

const MapPicker = dynamic(() => import("@/components/admin/MapPicker"), { ssr: false });

const DEFAULT_LAT = 27.7172;
const DEFAULT_LNG = 85.3240;

interface NominatimResult { place_id: number; display_name: string; lat: string; lon: string; }

async function geocode(query: string): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", Nepal")}&format=json&limit=5&countrycodes=np`;
  const res = await fetch(url, { headers: { "User-Agent": "EVA-Nepal-Admin/1.0 (evanepal.org)" } });
  if (!res.ok) throw new Error("Geocoding failed");
  return res.json() as Promise<NominatimResult[]>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPES: { value: string; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "networking",  label: "Networking",  icon: <Handshake size={18} />,    desc: "Industry mixers, meet-and-greet events" },
  { value: "training",    label: "Training",    icon: <GraduationCap size={18} />, desc: "Workshops, skill sessions, certifications" },
  { value: "meeting",     label: "Meeting",     icon: <Users size={18} />,         desc: "Committee meetings, AGM, board sessions" },
  { value: "exhibition",  label: "Exhibition",  icon: <LayoutGrid size={18} />,    desc: "Trade shows, venue showcases, expos" },
  { value: "conference",  label: "Conference",  icon: <Presentation size={18} />,  desc: "Summits, symposiums, industry conferences" },
];

const STEPS = [
  { id: 1, label: "Event Basics",  icon: CalendarDays, hint: "Title, slug, and event type" },
  { id: 2, label: "When & Where",  icon: MapPin,       hint: "Dates, location, and attendance" },
  { id: 3, label: "Details",       icon: FileText,     hint: "Keywords, description, and photo" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateInput(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

function autoStatus(dateStr: string): "upcoming" | "past" {
  if (!dateStr) return "upcoming";
  return new Date(dateStr) >= new Date() ? "upcoming" : "past";
}

function buildDescription(params: {
  title: string; type: string; location: string; date: string; attendees: string; keywords: string;
}): string {
  const { title, type, location, date, attendees, keywords } = params;
  const typeLabel = EVENT_TYPES.find((t) => t.value === type)?.label ?? type;
  const dateStr = date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
  const capTx  = attendees ? ` with an expected attendance of ${attendees} participants` : "";
  const locTx  = location ? ` at ${location}` : "";
  const dateTx = dateStr ? ` on ${dateStr}` : "";
  const kwList = keywords.split(",").map((k) => k.trim()).filter(Boolean);
  const kwTx   = kwList.length > 0 ? ` Key highlights include: ${kwList.join(", ")}.` : "";

  const variants = [
    `EVA Nepal is pleased to announce ${title}, a ${typeLabel.toLowerCase()} event${dateTx}${locTx}${capTx}. This event brings together venue professionals and industry stakeholders to share insights, build connections, and strengthen the events industry in Nepal.${kwTx}`,

    `${title} is an upcoming ${typeLabel.toLowerCase()} organized by EVA Nepal${dateTx}${locTx}. ${capTx ? `The event is expected to host${capTx}.` : ""} Join us for an engaging session designed to advance the event and venue industry across Kathmandu Valley.${kwTx}`,

    `EVA Nepal invites members and industry professionals to ${title}${dateTx}. Taking place${locTx}, this ${typeLabel.toLowerCase()} is a key gathering${capTx} dedicated to fostering collaboration and professional growth within Nepal's event sector.${kwTx}`,

    `${title} is a ${typeLabel.toLowerCase()} event hosted by EVA Nepal${dateTx}${locTx}${capTx}. As part of our commitment to elevating industry standards, this event provides a platform for networking, learning, and advancing the collective interests of our members.${kwTx}`,
  ];

  return variants[Math.floor(Math.random() * variants.length)];
}

// ─── Helper tooltip ────────────────────────────────────────────────────────────
function HelperTip({ text }: { text: string }) {
  return (
    <div className="relative group inline-flex items-center">
      <Info size={12} className="text-gray-300 hover:text-indigo-400 cursor-help transition-colors ml-0.5" />
      <div className="absolute left-0 bottom-full mb-2 z-30 hidden group-hover:block w-56 bg-gray-900 text-white text-[11px] rounded-xl px-3 py-2 shadow-xl pointer-events-none leading-relaxed">
        {text}
        <div className="absolute top-full left-3 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props { event?: Event }

export default function EventForm({ event }: Props) {
  const router = useRouter();
  const [step,       setStep]       = useState(1);
  const [dir,        setDir]        = useState(1);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [genLoading,    setGenLoading]    = useState(false);
  const [descNeLoading, setDescNeLoading] = useState(false);
  const [statusMode,    setStatusMode]    = useState<"auto" | "manual">("auto");
  const [keywords,      setKeywords]      = useState("");

  // Auto-translate state
  const [translating,  setTranslating]  = useState(false);
  const neManualRef = useRef(!!(event?.titleNe)); // true = user has typed manually, skip auto-translate

  // Coordinate paste state
  const [coordPaste,      setCoordPaste]      = useState("");
  const [coordPasteError, setCoordPasteError] = useState("");

  // Geocoding state
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoResults, setGeoResults] = useState<NominatimResult[]>([]);
  const [geoError,   setGeoError]   = useState("");
  const [mapPreview, setMapPreview] = useState<{ lat: number; lng: number } | null>(
    event?.latitude && event?.longitude ? { lat: event.latitude, lng: event.longitude } : null
  );

  const [form, setForm] = useState({
    title:         event?.title         ?? "",
    titleNe:       event?.titleNe       ?? "",
    slug:          event?.slug          ?? "",
    description:   event?.description   ?? "",
    descriptionNe: event?.descriptionNe ?? "",
    date:        toDateInput(event?.date),
    endDate:     toDateInput(event?.endDate),
    startTime:   event?.startTime   ?? "",
    endTime:     event?.endTime     ?? "",
    location:    event?.location    ?? "",
    latitude:    event?.latitude    != null ? String(event.latitude)  : "",
    longitude:   event?.longitude   != null ? String(event.longitude) : "",
    type:        event?.type        ?? "",
    status:      event?.status      ?? "upcoming",
    attendees:   String(event?.attendees ?? ""),
    image:       event?.image       ?? "",
  });

  function set(k: string, v: string) {
    setForm((p) => {
      const next = { ...p, [k]: v };
      if (k === "date" && statusMode === "auto") {
        next.status = autoStatus(v);
      }
      return next;
    });
    if (k === "title" && !event) {
      const slug = (v as string).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      setForm((p) => ({ ...p, slug, title: v }));
    }
  }

  // ── Auto-translate title → Nepali (debounced, skipped if user typed manually) ──
  useEffect(() => {
    if (neManualRef.current) return;
    const title = form.title.trim();
    if (!title) return;

    const timer = setTimeout(async () => {
      setTranslating(true);
      try {
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(title)}&langpair=en|ne`
        );
        const data = await res.json() as { responseData?: { translatedText?: string }; responseStatus?: number };
        const translated = data?.responseData?.translatedText;
        if (translated && typeof translated === "string" && data.responseStatus === 200) {
          setForm((p) => ({ ...p, titleNe: translated }));
        }
      } catch { /* silently fail — translation is optional */ }
      setTranslating(false);
    }, 900);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  // ── Geocoding ─────────────────────────────────────────────────────────────
  async function handleGeocode() {
    const addr = form.location.trim();
    if (!addr) { setGeoError("Please enter a location name or address first."); return; }
    setGeoLoading(true); setGeoError(""); setGeoResults([]);
    try {
      let results = await geocode(addr);
      if (results.length === 0) results = await geocode(`${addr}, Kathmandu`);
      if (results.length === 0) {
        setGeoError("Location not found. Try a nearby landmark, or paste coordinates from Google Maps below.");
      } else {
        setGeoResults(results);
      }
    } catch {
      setGeoError("Could not reach location service. Please paste coordinates from Google Maps below.");
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

  // ── Coordinate paste ──────────────────────────────────────────────────────
  function handleCoordPaste(val: string) {
    setCoordPaste(val);
    setCoordPasteError("");
    const clean = val.trim();
    if (!clean) return;

    // Match: "27.717245, 85.323960" or "27.717245,85.323960" or with negatives
    const match = clean.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
    if (!match) {
      setCoordPasteError("Format not recognised. Should look like: 27.7172, 85.3240");
      return;
    }
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setCoordPasteError("Coordinates out of valid range.");
      return;
    }
    setForm((p) => ({ ...p, latitude: String(lat), longitude: String(lng) }));
    setMapPreview({ lat, lng });
  }

  // ── Description generation ────────────────────────────────────────────────
  async function handleGenerate() {
    setGenLoading(true);
    let englishText = "";
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "event",
          title:     form.title,
          eventType: form.type,
          location:  form.location,
          date:      form.date,
          attendees: form.attendees,
          keywords,
        }),
      });
      const json = await res.json() as { success: boolean; data?: { text: string }; error?: string };
      if (json.success && json.data?.text) {
        englishText = json.data.text;
      }
    } catch { /* fall through to template */ }

    if (!englishText) {
      englishText = buildDescription({
        title: form.title, type: form.type, location: form.location,
        date: form.date, attendees: form.attendees, keywords,
      });
    }

    setForm((p) => ({ ...p, description: englishText }));
    setGenLoading(false);

    // Auto-translate to Nepali
    await translateDescriptionToNepali(englishText);
  }

  // ── Nepali description translation ────────────────────────────────────────
  async function translateDescriptionToNepali(text: string) {
    if (!text.trim()) return;
    setDescNeLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "translate", text, targetLang: "ne" }),
      });
      const json = await res.json() as { success: boolean; data?: { text: string } };
      if (json.success && json.data?.text) {
        setForm((p) => ({ ...p, descriptionNe: json.data!.text }));
      }
    } catch { /* silently fail — Nepali is optional */ }
    setDescNeLoading(false);
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validateStep(s: number): string {
    if (s === 1 && !form.title.trim())  return "Event title is required.";
    if (s === 1 && !form.slug.trim())   return "Slug is required.";
    if (s === 1 && !form.type)          return "Please select an event type.";
    if (s === 2 && !form.date)          return "Start date is required.";
    if (s === 2 && !form.location.trim()) return "Location is required.";
    if (s === 2 && form.endDate && form.endDate < form.date) return "End date cannot be before start date.";
    if (s === 2 && form.endDate === form.date && form.endTime && form.startTime && form.endTime <= form.startTime)
      return "End time must be after start time when the event is on the same day.";
    if (s === 2 && form.attendees && (isNaN(Number(form.attendees)) || Number(form.attendees) < 1))
      return "Expected attendees must be a positive number.";
    if (s === 3 && !form.description.trim()) return "Description is required.";
    return "";
  }

  function goNext() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(""); setDir(1); setStep((s) => Math.min(3, s + 1));
  }
  function goBack() { setError(""); setDir(-1); setStep((s) => Math.max(1, s - 1)); }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setSaving(true); setError("");

    const body = {
      ...form,
      attendees:  form.attendees  ? Number(form.attendees)      : null,
      endDate:    form.endDate    || null,
      startTime:  form.startTime  || null,
      endTime:    form.endTime    || null,
      latitude:   form.latitude   ? parseFloat(form.latitude)   : null,
      longitude:  form.longitude  ? parseFloat(form.longitude)  : null,
    };

    const url    = event ? `/api/events/${event.id}` : "/api/events";
    const method = event ? "PUT" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    if (!res.ok) {
      let msg = "Failed to save. Please try again.";
      try { const e = await res.json() as { error?: string }; msg = e.error ?? msg; } catch { /* empty */ }
      setError(msg); setSaving(false); return;
    }
    router.push("/admin/events");
    router.refresh();
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition";

  const stepVariants = {
    enter:  (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  const selectedType = EVENT_TYPES.find((t) => t.value === form.type);
  const mapLat = mapPreview?.lat ?? DEFAULT_LAT;
  const mapLng = mapPreview?.lng ?? DEFAULT_LNG;
  const coordPasteOk = coordPaste && !coordPasteError && form.latitude && form.longitude;

  return (
    <div className="max-w-2xl">
      {/* ── Progress bar ──────────────────────────────────────────────── */}
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
                    {done
                      ? <Check size={16} className="text-white" strokeWidth={2.5} />
                      : <Icon size={16} className={cur ? "text-white" : "text-gray-400"} />}
                  </motion.div>
                  <span className={`text-[10px] font-medium hidden sm:block ${cur ? "text-amber-600" : done ? "text-emerald-600" : "text-gray-400"}`}>
                    {s.label}
                  </span>
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

      {/* ── Card ──────────────────────────────────────────────────────── */}
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

            {/* ── STEP 1: Event Basics ──────────────────────────────── */}
            {step === 1 && (<>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Start with the official event name as it should appear publicly, then choose the type.</p>
              </div>

              {/* Title */}
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                  <CalendarDays size={13} className="text-gray-400" />
                  Event Title *
                  <HelperTip text="The official name of the event, as it will appear on the public website." />
                </label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. EVA Nepal Annual General Meeting 2082" required className={inputCls} />
              </div>

              {/* Nepali title with auto-translate */}
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                  <Languages size={13} className="text-gray-400" />
                  Title in Nepali
                  <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  <HelperTip text="The Nepali translation. Start typing the English title above — it will auto-translate for you. You can then edit or correct it." />
                </label>
                <div className="relative">
                  <input
                    value={form.titleNe}
                    onChange={(e) => {
                      set("titleNe", e.target.value);
                      neManualRef.current = true;
                    }}
                    placeholder="नेपालीमा शीर्षक"
                    className={`${inputCls} ${translating ? "pr-32" : ""}`}
                  />
                  {translating && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-indigo-500 pointer-events-none">
                      <Loader2 size={11} className="animate-spin" /> Auto-translating…
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Auto-filled by translating the English title. Edit freely — once you type, auto-translate stops.
                </p>
              </div>

              {/* Slug */}
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                  URL Slug *
                  <HelperTip text="Used in the public URL: /events/your-slug. Auto-filled from the title. Lowercase letters, numbers, and hyphens only." />
                </label>
                <div className="flex items-center gap-0">
                  <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 border-r-0 rounded-l-xl px-3 py-2.5 whitespace-nowrap">events/</span>
                  <input value={form.slug} onChange={(e) => set("slug", e.target.value)} required
                    className={`flex-1 px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${event ? "border-r-0 rounded-none" : "rounded-r-xl"}`} />
                  {event && (
                    <button
                      type="button"
                      title="Re-generate slug from title"
                      onClick={() => {
                        const s = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                        setForm((p) => ({ ...p, slug: s }));
                      }}
                      className="flex items-center gap-1 px-3 py-2.5 border border-gray-200 border-l-0 rounded-r-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <RefreshCw size={12} />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {event
                    ? "Kept stable to preserve existing links. Click the refresh icon to re-generate from title."
                    : "Auto-filled from title. Lowercase letters, numbers, and hyphens only."}
                </p>
              </div>

              {/* Event type */}
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                  Event Type *
                  <HelperTip text="Pick the category that best describes this event. Helps members find events relevant to them." />
                </label>
                <p className="text-[11px] text-gray-400 mb-3">Pick the category that best describes this event.</p>
                <div className="grid grid-cols-1 gap-2">
                  {EVENT_TYPES.map((t) => {
                    const sel = form.type === t.value;
                    return (
                      <button key={t.value} type="button" onClick={() => set("type", t.value)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all
                          ${sel ? "bg-amber-50 border-amber-400 shadow-sm" : "bg-white border-gray-200 hover:border-amber-300"}`}>
                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors
                          ${sel ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                          {t.icon}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold ${sel ? "text-amber-800" : "text-gray-700"}`}>{t.label}</p>
                          <p className="text-[11px] text-gray-400 truncate">{t.desc}</p>
                        </div>
                        {sel && <Check size={15} className="ml-auto text-amber-500 flex-shrink-0" strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>)}

            {/* ── STEP 2: When & Where ──────────────────────────────── */}
            {step === 2 && (<>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">Set the event date, time, and location. Status is automatically set to <strong>Upcoming</strong> or <strong>Past</strong> based on the date.</p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                    <CalendarDays size={13} className="text-gray-400" /> Start Date *
                  </label>
                  <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required className={inputCls} />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                    End Date
                    <span className="text-gray-400 font-normal text-xs">(optional)</span>
                    <HelperTip text="Only needed for multi-day events. Leave blank for single-day." />
                  </label>
                  <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Times */}
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                  <Clock size={13} className="text-gray-400" />
                  Event Time
                  <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  <HelperTip text="The start and end time of the event. Leave blank if not yet confirmed." />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} className={inputCls} />
                    <p className="text-[11px] text-gray-400 mt-1">Start time</p>
                  </div>
                  <div>
                    <input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} className={inputCls} />
                    <p className="text-[11px] text-gray-400 mt-1">End time</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                    Status
                    <HelperTip text="Auto mode sets Upcoming/Past based on the date. Use Manual if you need to override this." />
                  </label>
                  <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
                    {(["auto", "manual"] as const).map((m) => (
                      <button key={m} type="button" onClick={() => {
                        setStatusMode(m);
                        if (m === "auto") setForm((p) => ({ ...p, status: autoStatus(p.date) }));
                      }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${statusMode === m ? "bg-white shadow-sm text-amber-600" : "text-gray-400 hover:text-gray-600"}`}>
                        {m === "auto" ? "Auto" : "Manual"}
                      </button>
                    ))}
                  </div>
                </div>
                {statusMode === "auto" ? (
                  <div className={`px-4 py-2.5 rounded-xl border text-sm font-medium
                    ${form.status === "upcoming" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-100 border-gray-200 text-gray-600"}`}>
                    {form.status === "upcoming" ? "Upcoming" : "Past"} — auto-set from date
                    {!form.date && <span className="font-normal text-gray-400"> (set a date first)</span>}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {(["upcoming", "past"] as const).map((s) => (
                      <button key={s} type="button" onClick={() => set("status", s)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all capitalize
                          ${form.status === s
                            ? s === "upcoming" ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "bg-gray-100 border-gray-400 text-gray-700"
                            : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                  <MapPin size={13} className="text-gray-400" />
                  Location *
                  <HelperTip text="The venue name and area shown to the public. E.g. Hotel Yak & Yeti, Kathmandu." />
                </label>
                <div className="flex gap-2">
                  <input value={form.location} onChange={(e) => set("location", e.target.value)}
                    placeholder="e.g. Hotel Yak & Yeti, Kathmandu" required className={inputCls} />
                  <button type="button" onClick={handleGeocode} disabled={geoLoading}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap flex-shrink-0">
                    {geoLoading ? <><Loader2 size={11} className="animate-spin" /> Locating…</> : <><Navigation size={11} /> Find on Map</>}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Click &quot;Find on Map&quot; to search and pin the location automatically.</p>
              </div>

              {/* Geocode error */}
              {geoError && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-start gap-1.5">
                  <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />{geoError}
                </p>
              )}

              {/* Geocode results */}
              {geoResults.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
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

              {/* Map picker */}
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                  <Crosshair size={13} className="text-gray-400" />
                  Map Pin
                  <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  <HelperTip text="Click on the map or drag the pin to mark the exact venue. Members can tap this for directions." />
                </label>
                <p className="text-[11px] text-gray-400 mb-2">Click or drag the pin to mark the exact venue location.</p>
                <MapPicker
                  lat={mapLat}
                  lng={mapLng}
                  onPick={(lat, lng) => {
                    setMapPreview({ lat, lng });
                    setForm((p) => ({ ...p, latitude: String(lat), longitude: String(lng) }));
                  }}
                />
                {mapPreview ? (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <Check size={11} /> Pinned — {mapPreview.lat.toFixed(5)}, {mapPreview.lng.toFixed(5)}
                    </span>
                    <button type="button" onClick={() => { setMapPreview(null); setCoordPaste(""); setForm((p) => ({ ...p, latitude: "", longitude: "" })); }}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors">
                      Remove pin
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1.5">No pin set — click map, use &quot;Find on Map&quot;, or paste coordinates below.</p>
                )}

                {/* ── Paste coordinates from Google Maps ── */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <Crosshair size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-blue-800 mb-1">Paste coordinates from Google Maps</p>
                      <p className="text-[11px] text-blue-600 leading-relaxed">
                        <strong>How to get coordinates:</strong> Open Google Maps → navigate to the venue → right-click on the exact spot → the coordinates appear at the top of the menu (e.g. <em>27.7172, 85.3240</em>) → click them to copy → paste below.
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      value={coordPaste}
                      onChange={(e) => handleCoordPaste(e.target.value)}
                      placeholder="27.717245, 85.323960"
                      className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white placeholder-gray-300"
                    />
                    {coordPasteOk && (
                      <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                  {coordPasteError && (
                    <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={11} /> {coordPasteError}
                    </p>
                  )}
                  {coordPasteOk && (
                    <p className="text-[11px] text-green-600 mt-1.5 flex items-center gap-1">
                      <Check size={11} /> Map pin updated — {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
                    </p>
                  )}
                </div>

                {/* Manual lat/lng (secondary) */}
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none py-1">Enter lat/lng manually (advanced)</summary>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                      <input type="number" step="any" value={form.latitude}
                        onChange={(e) => { set("latitude", e.target.value); if (e.target.value && form.longitude) setMapPreview({ lat: parseFloat(e.target.value), lng: parseFloat(form.longitude) }); }}
                        placeholder="e.g. 27.7172"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                      <input type="number" step="any" value={form.longitude}
                        onChange={(e) => { set("longitude", e.target.value); if (form.latitude && e.target.value) setMapPreview({ lat: parseFloat(form.latitude), lng: parseFloat(e.target.value) }); }}
                        placeholder="e.g. 85.3240"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                  </div>
                </details>
              </div>

              {/* Attendees */}
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                  <Users size={13} className="text-gray-400" />
                  Expected Attendees
                  <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  <HelperTip text="Approximate number of participants. Helps members plan whether to attend." />
                </label>
                <div className="relative">
                  <input type="number" min={1} value={form.attendees}
                    onChange={(e) => { const v = e.target.value; if (v === "" || Number(v) >= 1) set("attendees", v); }}
                    placeholder="e.g. 150" className={`${inputCls} pr-20`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">people</span>
                </div>
              </div>
            </>)}

            {/* ── STEP 3: Details ───────────────────────────────────── */}
            {step === 3 && (<>
              {/* Keywords */}
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                  <Tag size={13} className="text-gray-400" />
                  Keywords / Talking Points
                  <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  <HelperTip text="Enter key topics or themes, comma-separated. These will be woven into the auto-generated description." />
                </label>
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. AGM 2025, venue showcase, industry growth, networking"
                  className={inputCls}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Optional. Used by &quot;Auto-Generate&quot; to produce a more specific description.
                </p>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                    <FileText size={13} className="text-gray-400" />
                    Event Description *
                    <HelperTip text="Shown on the public events page. Describe what the event is, who should attend, and what they can expect." />
                  </label>
                  <button type="button" onClick={handleGenerate} disabled={genLoading || !form.title}
                    title={!form.title ? "Enter event title first (Step 1)" : "Generate a description from the info entered"}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-40 transition-colors">
                    {genLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    {genLoading ? "Generating…" : "Auto-Generate"}
                  </button>
                </div>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={6}
                  placeholder="Describe the event — or add keywords above and click Auto-Generate…"
                  className={`${inputCls} resize-none`} />
                <p className="text-[11px] text-gray-400 mt-1">You can edit any auto-generated text freely.</p>
              </div>

              {/* Nepali Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                    <Languages size={13} className="text-indigo-400" />
                    विवरण (Nepali Description)
                    <span className="text-gray-400 font-normal text-xs">(optional)</span>
                    <HelperTip text="Nepali translation of the event description. Auto-filled when you click Auto-Generate, or translate manually below." />
                  </label>
                  <button
                    type="button"
                    onClick={() => translateDescriptionToNepali(form.description)}
                    disabled={descNeLoading || !form.description.trim()}
                    title={!form.description.trim() ? "Generate or write an English description first" : "Translate current description to Nepali"}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-40 transition-colors"
                  >
                    {descNeLoading ? <Loader2 size={11} className="animate-spin" /> : <Languages size={11} />}
                    {descNeLoading ? "Translating…" : "Translate"}
                  </button>
                </div>
                <textarea
                  value={form.descriptionNe}
                  onChange={(e) => set("descriptionNe", e.target.value)}
                  rows={6}
                  placeholder="नेपाली विवरण यहाँ लेख्नुहोस् वा माथिको 'Translate' बटन थिच्नुहोस्…"
                  className={`${inputCls} resize-none`}
                />
                {descNeLoading && (
                  <p className="text-[11px] text-indigo-500 mt-1 flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" /> Translating to Nepali…
                  </p>
                )}
              </div>

              {/* Image */}
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                  Cover Image
                  <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  <HelperTip text="A banner or photo shown on the public events page. Recommended: landscape, at least 1200×600px." />
                </label>
                <p className="text-[11px] text-gray-400 mb-2">Upload a banner or photo for this event.</p>
                <ImageUpload value={form.image} onChange={(url) => set("image", url)} />
              </div>

              {/* Review summary */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Review Before Saving</p>
                <div className="space-y-2">
                  {([
                    ["Title",     form.title || "—"],
                    ["Type",      selectedType?.label ?? "—"],
                    ["Date",      form.date ? new Date(form.date).toDateString() : "—"],
                    ["End Date",  form.endDate ? new Date(form.endDate).toDateString() : "Single-day"],
                    ["Time",      form.startTime ? `${form.startTime}${form.endTime ? ` – ${form.endTime}` : ""}` : "—"],
                    ["Status",    form.status === "upcoming" ? "Upcoming" : "Past"],
                    ["Location",  form.location || "—"],
                    ["Map Pin",   mapPreview ? `${mapPreview.lat.toFixed(5)}, ${mapPreview.lng.toFixed(5)}` : "Not set"],
                    ["Attendees", form.attendees ? `~${form.attendees} people` : "—"],
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
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {/* Footer nav */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button type="button" onClick={goBack} disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft size={15} /> Back
          </button>
          <span className="text-xs text-gray-400">{step}/{STEPS.length}</span>
          {step < 3 ? (
            <button type="button" onClick={goNext}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#0a1040] text-white text-sm font-medium rounded-lg hover:bg-[#0d1550] shadow-sm transition-colors">
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={15} /> {event ? "Update Event" : "Save Event"}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
