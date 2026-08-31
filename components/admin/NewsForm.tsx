"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { News } from "@prisma/client";
import ImageUpload from "./ImageUpload";
import MultiImageUpload from "./MultiImageUpload";
import {
  FileText, AlignLeft, CalendarDays, Image as ImageIcon,
  ChevronRight, ChevronLeft, Check, Info, Star, Loader2,
  Globe, User, Sparkles, Languages, Clock, FileEdit,
  CheckCircle2, Hash, AlertCircle,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "announcement", label: "Announcement", color: "bg-blue-50 border-blue-300 text-blue-800" },
  { value: "training",     label: "Training",     color: "bg-emerald-50 border-emerald-300 text-emerald-800" },
  { value: "event",        label: "Event",        color: "bg-amber-50 border-amber-300 text-amber-800" },
  { value: "industry",     label: "Industry",     color: "bg-purple-50 border-purple-300 text-purple-800" },
  { value: "member",       label: "Member",       color: "bg-rose-50 border-rose-300 text-rose-800" },
];

const STEPS = [
  { id: 1, label: "Article Basics", icon: FileText,      hint: "Title, slug, and category" },
  { id: 2, label: "Content",        icon: AlignLeft,     hint: "Excerpt and full article body" },
  { id: 3, label: "Details",        icon: CalendarDays,  hint: "Author, date, and publishing" },
  { id: 4, label: "Media & Review", icon: ImageIcon,     hint: "Cover image and review before saving" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidDate(v: string) {
  return v.length === 10 && !isNaN(new Date(v).getTime());
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatDateDisplay(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isFutureDate(dateStr: string) {
  if (!dateStr) return false;
  return new Date(dateStr) > new Date(todayStr() + "T23:59:59");
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props { article?: News }

export default function NewsForm({ article }: Props) {
  const router = useRouter();
  const [step,       setStep]       = useState(1);
  const [dir,        setDir]        = useState(1);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiError,    setAiError]    = useState("");
  const [aiKeywords, setAiKeywords] = useState("");

  // Auto-translate title → Nepali
  const [translating,  setTranslating]  = useState(false);
  const neManualRef         = useRef(!!(article?.titleNe));
  const excerptNeManualRef  = useRef(!!(article?.excerptNe));
  const contentNeManualRef  = useRef(!!(article?.contentNe));

  const toDateInput = (d: Date | null | undefined) =>
    d ? new Date(d).toISOString().slice(0, 10) : todayStr();

  const [form, setForm] = useState({
    title:       article?.title       ?? "",
    titleNe:     article?.titleNe     ?? "",
    slug:        article?.slug        ?? "",
    excerpt:     article?.excerpt     ?? "",
    excerptNe:   article?.excerptNe   ?? "",
    content:     article?.content     ?? "",
    contentNe:   article?.contentNe   ?? "",
    author:      article?.author      ?? "",
    category:    article?.category    ?? "announcement",
    publishedAt: toDateInput(article?.publishedAt),
    publishTime: article?.publishedAt ? new Date(article.publishedAt).toTimeString().slice(0, 5) : "09:00",
    status:      article?.status      ?? "published",
    featured:    article?.featured    ?? false,
    image:       article?.image       ?? "",
    externalLink: article?.externalLink ?? "",
  });

  const [galleryImages, setGalleryImages] = useState<string[]>(article?.galleryImages ?? []);

  const [translatingExcerpt, setTranslatingExcerpt] = useState(false);
  const [translatingContent, setTranslatingContent] = useState(false);
  const [excerptTranslateError, setExcerptTranslateError] = useState("");
  const [contentTranslateError, setContentTranslateError] = useState("");

  function set(key: string, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !article) {
        next.slug = slugify(value as string);
      }
      // Auto-set status when date changes
      if (key === "publishedAt") {
        if (prev.status !== "draft") {
          next.status = isFutureDate(value as string) ? "scheduled" : "published";
        }
      }
      return next;
    });
  }

  // ── Auto-translate excerpt → Nepali (debounced, skip if user manually edited) ─
  useEffect(() => {
    if (excerptNeManualRef.current || !form.excerpt.trim()) return;
    const timer = setTimeout(async () => {
      setTranslatingExcerpt(true);
      try {
        const translated = await translateText(form.excerpt);
        if (translated) setForm((p) => ({ ...p, excerptNe: translated }));
      } catch { /* silently fail */ }
      setTranslatingExcerpt(false);
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.excerpt]);

  // ── Auto-translate content → Nepali (debounced, skip if user manually edited) ─
  useEffect(() => {
    if (contentNeManualRef.current || !form.content.trim()) return;
    const timer = setTimeout(async () => {
      setTranslatingContent(true);
      try {
        const translated = await translateText(form.content);
        if (translated) setForm((p) => ({ ...p, contentNe: translated }));
      } catch { /* silently fail */ }
      setTranslatingContent(false);
    }, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.content]);

  // ── Auto-translate title → Nepali ────────────────────────────────────────
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
      } catch { /* silently fail */ }
      setTranslating(false);
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  // ── AI Generate ─────────────────────────────────────────────────────────────
  async function generateWithAI() {
    setAiLoading(true); setAiError("");
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "news", title: form.title, category: form.category, keywords: aiKeywords }),
      });
      const json = await res.json() as { success: boolean; data?: { excerpt: string; content: string }; error?: string };
      if (!json.success || !json.data) throw new Error(json.error ?? "Generation failed");
      const { excerpt, content } = json.data;
      setForm((p) => ({ ...p, excerpt, content }));

      // Reset manual refs so auto-translate fires after generation
      excerptNeManualRef.current = false;
      contentNeManualRef.current = false;

      // Auto-translate both fields to Nepali after generation
      setTranslatingExcerpt(true);
      setTranslatingContent(true);
      const [excNe, contNe] = await Promise.all([
        translateText(excerpt).catch(() => null),
        translateText(content).catch(() => null),
      ]);
      setForm((p) => ({
        ...p,
        ...(excNe  ? { excerptNe: excNe }  : {}),
        ...(contNe ? { contentNe: contNe } : {}),
      }));
      setTranslatingExcerpt(false);
      setTranslatingContent(false);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI generation failed");
      setTranslatingExcerpt(false);
      setTranslatingContent(false);
    } finally {
      setAiLoading(false);
    }
  }

  // ── Translate helpers ────────────────────────────────────────────────────────
  async function translateText(text: string): Promise<string | null> {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "translate", text, targetLang: "ne" }),
    });
    const json = await res.json() as { success: boolean; data?: { text: string }; error?: string };
    return json.success && json.data?.text ? json.data.text : null;
  }

  async function translateExcerpt() {
    if (!form.excerpt.trim()) return;
    setTranslatingExcerpt(true);
    setExcerptTranslateError("");
    try {
      const translated = await translateText(form.excerpt);
      if (translated) setForm((p) => ({ ...p, excerptNe: translated }));
      else setExcerptTranslateError("Translation failed. You can write the Nepali excerpt manually.");
    } catch {
      setExcerptTranslateError("Couldn't reach the translation service. You can write the Nepali excerpt manually.");
    }
    setTranslatingExcerpt(false);
  }

  async function translateContent() {
    if (!form.content.trim()) return;
    setTranslatingContent(true);
    setContentTranslateError("");
    try {
      const translated = await translateText(form.content);
      if (translated) setForm((p) => ({ ...p, contentNe: translated }));
      else setContentTranslateError("Translation failed. You can write the Nepali content manually.");
    } catch {
      setContentTranslateError("Couldn't reach the translation service. You can write the Nepali content manually.");
    }
    setTranslatingContent(false);
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateStep(s: number): string {
    if (s === 1) {
      if (!form.title.trim())    return "Article title is required.";
      if (!form.slug.trim())     return "URL slug is required.";
      if (!/^[a-z0-9-]+$/.test(form.slug)) return "Slug can only contain lowercase letters, numbers, and hyphens.";
    }
    if (s === 2) {
      if (!form.excerpt.trim())  return "A short excerpt / summary is required.";
      if (!form.content.trim())  return "Article content cannot be empty.";
    }
    if (s === 3) {
      if (!form.author.trim())   return "Author name is required.";
      if (!isValidDate(form.publishedAt)) return "Please enter a valid date.";
    }
    return "";
  }

  function goNext() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(""); setDir(1); setStep((s) => Math.min(4, s + 1));
  }
  function goBack() { setError(""); setDir(-1); setStep((s) => Math.max(1, s - 1)); }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setSaving(true); setError("");
    const url    = article ? `/api/news/${article.id}` : "/api/news";
    const method = article ? "PUT" : "POST";

    // Combine date + time into publishedAt
    const publishedAt = form.publishTime
      ? `${form.publishedAt}T${form.publishTime}:00`
      : form.publishedAt;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, publishedAt, externalLink: form.externalLink || null, galleryImages }),
    });

    if (!res.ok) {
      let msg = "Failed to save. Please try again.";
      try { const e = await res.json() as { error?: string }; msg = e.error ?? msg; } catch { /* empty */ }
      setError(msg);
      setSaving(false);
      return;
    }
    router.push("/admin/news");
    router.refresh();
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedCategory = CATEGORIES.find((c) => c.value === form.category);
  const isFuture = isFutureDate(form.publishedAt);
  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition";

  const stepVariants = {
    enter:  (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  const submitLabel = () => {
    if (saving) return <><Loader2 size={14} className="animate-spin" /> Saving…</>;
    if (form.status === "draft") return <><FileEdit size={14} /> Save as Draft</>;
    if (form.status === "scheduled") return <><Clock size={14} /> Schedule Article</>;
    return <><Check size={15} /> {article ? "Update Article" : "Publish Article"}</>;
  };

  return (
    <div className="max-w-2xl">
      {/* Progress bar */}
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
                    animate={{
                      backgroundColor: done ? "#10b981" : cur ? "#f59e0b" : "#e5e7eb",
                      scale: cur ? 1.15 : 1,
                    }}
                    transition={{ duration: 0.25 }}
                    className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
                  >
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
          Step {step} of {STEPS.length} — {STEPS[step - 1].hint}
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex items-center gap-3">
          {(() => {
            const Icon = STEPS[step - 1].icon;
            return (
              <div className="p-2 bg-amber-50 rounded-xl">
                <Icon size={18} className="text-amber-600" />
              </div>
            );
          })()}
          <div>
            <h2 className="font-bold text-gray-900">{STEPS[step - 1].label}</h2>
            <p className="text-xs text-gray-400">{STEPS[step - 1].hint}</p>
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
            className="px-4 sm:px-6 py-5 sm:py-6 space-y-5"
          >

            {/* ── STEP 1 ── */}
            {step === 1 && (<>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Start with the official article title — exactly as it should appear on the public news page.
                  The URL slug and Nepali title are auto-filled.
                </p>
              </div>

              {/* Title EN */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                  <FileText size={13} className="text-gray-400" /> Article Title (English) *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Association Hosts Annual Member Summit 2081"
                  className={inputCls}
                />
                <p className="text-[11px] text-gray-400 mt-1">Shown as the main headline on the news card and article page.</p>
              </div>

              {/* Title NE */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                  <Languages size={13} className="text-indigo-400" />
                  शीर्षक (Nepali Title)
                  <span className="text-gray-400 font-normal text-xs">optional</span>
                  {translating && <Loader2 size={11} className="animate-spin text-indigo-400 ml-1" />}
                </label>
                <input
                  value={form.titleNe}
                  onChange={(e) => {
                    neManualRef.current = true;
                    set("titleNe", e.target.value);
                  }}
                  placeholder="नेपालीमा शीर्षक — Enter English title to auto-fill"
                  className={inputCls}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  {translating ? "Auto-translating from English title…" : "Auto-filled when you type the English title. Edit freely to correct."}
                </p>
              </div>

              {/* Slug */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                  <Hash size={13} className="text-gray-400" /> URL Slug *
                  <span title="Auto-filled from the title. Used in the public article URL." className="inline-flex text-gray-400 cursor-help">
                    <Info size={12} />
                  </span>
                </label>
                <div className="flex items-center gap-0">
                  <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 border-r-0 rounded-l-xl px-3 py-2.5 whitespace-nowrap">
                    news/
                  </span>
                  <input
                    value={form.slug}
                    onChange={(e) => set("slug", e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Lowercase letters, numbers, and hyphens only.</p>
              </div>

              {/* Category */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                  <Globe size={13} className="text-gray-400" /> Category *
                </label>
                <p className="text-[11px] text-gray-400 mb-3">Choose the type of article. Shown as a coloured badge on the news card.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c.value} type="button" onClick={() => set("category", c.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all
                        ${form.category === c.value
                          ? `${c.color} shadow-sm ring-2 ring-offset-1 ring-amber-400`
                          : "bg-white border-gray-200 text-gray-500 hover:border-amber-300"
                        }`}
                    >
                      <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors
                        ${form.category === c.value ? "bg-amber-500 border-amber-500" : "border-gray-300"}`}>
                        {form.category === c.value && <Check size={10} className="text-white" strokeWidth={3} />}
                      </span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </>)}

            {/* ── STEP 2 ── */}
            {step === 2 && (<>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  The excerpt appears as the preview text on the news listing page. Keep it to 1–2 sentences that hook the reader.
                </p>
              </div>

              {/* AI Generate */}
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
                  <Sparkles size={12} /> AI Content Generation
                </div>
                <div>
                  <label className="block text-xs font-medium text-violet-700 mb-1">
                    Keywords / hints <span className="text-violet-400 font-normal">(optional)</span>
                  </label>
                  <input
                    value={aiKeywords}
                    onChange={(e) => setAiKeywords(e.target.value)}
                    placeholder="e.g. annual meeting, membership drive, training workshop, Kathmandu"
                    className="w-full px-3 py-2 border border-violet-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <p className="text-[11px] text-violet-500 mt-1">The AI will weave these into the article naturally.</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-violet-600 font-medium truncate max-w-[60%]">
                    {form.title || <span className="text-violet-400">Enter a title in Step 1 first</span>}
                  </p>
                  <button type="button" onClick={generateWithAI} disabled={!form.title || aiLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    {aiLoading ? <><Loader2 size={11} className="animate-spin" /> Generating…</> : <><Sparkles size={11} /> Generate Article</>}
                  </button>
                </div>
              </div>
              {aiError && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{aiError}</div>
              )}

              {/* Excerpt */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                  <AlignLeft size={13} className="text-gray-400" /> Short Excerpt / Summary *
                </label>
                <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={3}
                  placeholder="A brief 1–2 sentence summary shown on the news listing page…"
                  className={`${inputCls} resize-none`} />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-gray-400">Shown on the news card as the preview description.</p>
                  <span className={`text-[11px] font-medium ${form.excerpt.length > 200 ? "text-amber-600" : "text-gray-400"}`}>
                    {form.excerpt.length} chars
                  </span>
                </div>
              </div>

              {/* Excerpt NE */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <Languages size={13} className="text-indigo-400" /> सारांश (Nepali Excerpt)
                    <span className="text-gray-400 font-normal text-xs">optional</span>
                  </label>
                  <button type="button" onClick={translateExcerpt} disabled={!form.excerpt.trim() || translatingExcerpt}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    {translatingExcerpt ? <><Loader2 size={10} className="animate-spin" /> Translating…</> : <><Languages size={10} /> Translate</>}
                  </button>
                </div>
                <textarea value={form.excerptNe} onChange={(e) => { excerptNeManualRef.current = true; set("excerptNe", e.target.value); }} rows={3}
                  placeholder="नेपालीमा सारांश — auto-fills from English summary"
                  className={`${inputCls} resize-none`} />
                <p className="text-[11px] text-gray-400 mt-1">Shown on the news card in Nepali. Auto-translatable from the English excerpt above.</p>
                {excerptTranslateError && (
                  <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {excerptTranslateError}
                  </p>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                  <FileText size={13} className="text-gray-400" /> Full Article Content *
                </label>
                <textarea value={form.content} onChange={(e) => set("content", e.target.value)} rows={10}
                  placeholder="Write the full article here. Use blank lines to separate paragraphs…"
                  className={`${inputCls} resize-y`} />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-gray-400">Displayed on the full article page.</p>
                  <span className={`text-[11px] font-medium ${form.content.length > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                    {form.content.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
              </div>

              {/* Content NE */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <Languages size={13} className="text-indigo-400" /> लेखको विषयवस्तु (Nepali Content)
                    <span className="text-gray-400 font-normal text-xs">optional</span>
                  </label>
                  <button type="button" onClick={translateContent} disabled={!form.content.trim() || translatingContent}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    {translatingContent ? <><Loader2 size={10} className="animate-spin" /> Translating…</> : <><Languages size={10} /> Translate</>}
                  </button>
                </div>
                <textarea value={form.contentNe} onChange={(e) => { contentNeManualRef.current = true; set("contentNe", e.target.value); }} rows={10}
                  placeholder="नेपालीमा पूर्ण लेख — auto-fills from English content"
                  className={`${inputCls} resize-y`} />
                <p className="text-[11px] text-gray-400 mt-1">Full article in Nepali. Displayed with an EN/NE toggle on the public article page.</p>
                {contentTranslateError && (
                  <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {contentTranslateError}
                  </p>
                )}
              </div>
            </>)}

            {/* ── STEP 3 ── */}
            {step === 3 && (<>
              {/* Author */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                  <User size={13} className="text-gray-400" /> Author *
                </label>
                <input value={form.author} onChange={(e) => set("author", e.target.value)}
                  placeholder="e.g. Association Secretariat"
                  className={inputCls} />
                <p className="text-[11px] text-gray-400 mt-1">
                  Use &ldquo;Association Secretariat&rdquo; for official communications.
                </p>
              </div>

              {/* Publish mode */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-3">
                  <CalendarDays size={13} className="text-gray-400" /> Publishing
                </label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {/* Publish now */}
                  <button type="button"
                    onClick={() => setForm((p) => ({ ...p, status: "published", publishedAt: todayStr() }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                      form.status === "published"
                        ? "bg-green-50 border-green-400 text-green-800 ring-2 ring-offset-1 ring-green-400"
                        : "bg-white border-gray-200 text-gray-500 hover:border-green-300"
                    }`}>
                    <CheckCircle2 size={18} className={form.status === "published" ? "text-green-600" : "text-gray-300"} />
                    Publish Now
                  </button>
                  {/* Schedule */}
                  <button type="button"
                    onClick={() => setForm((p) => ({ ...p, status: "scheduled" }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                      form.status === "scheduled"
                        ? "bg-indigo-50 border-indigo-400 text-indigo-800 ring-2 ring-offset-1 ring-indigo-400"
                        : "bg-white border-gray-200 text-gray-500 hover:border-indigo-300"
                    }`}>
                    <Clock size={18} className={form.status === "scheduled" ? "text-indigo-600" : "text-gray-300"} />
                    Schedule
                  </button>
                  {/* Draft */}
                  <button type="button"
                    onClick={() => setForm((p) => ({ ...p, status: "draft" }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                      form.status === "draft"
                        ? "bg-gray-100 border-gray-400 text-gray-800 ring-2 ring-offset-1 ring-gray-400"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
                    }`}>
                    <FileEdit size={18} className={form.status === "draft" ? "text-gray-600" : "text-gray-300"} />
                    Save Draft
                  </button>
                </div>

                {/* Status info + date picker */}
                {form.status === "published" && (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex gap-2">
                      <CheckCircle2 size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-green-700">
                        This article will be <strong>visible on the public news page immediately</strong> when saved.
                        You can still pick a past display date — it will just sort by that date in the news feed.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Display Date *</label>
                        <input type="date" value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)}
                          className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Display Time</label>
                        <input type="time" value={form.publishTime} onChange={(e) => set("publishTime", e.target.value)}
                          className={inputCls} />
                      </div>
                    </div>
                  </div>
                )}

                {form.status === "scheduled" && (
                  <div className="space-y-3">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex gap-2">
                      <Clock size={14} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-indigo-700">
                        This article is <strong>scheduled</strong>. It will become visible on the public news page automatically on the date and time you choose below. Not visible to visitors until then.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Publish Date *</label>
                        <input type="date" value={form.publishedAt}
                          min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                          onChange={(e) => set("publishedAt", e.target.value)}
                          className={inputCls} />
                        {!isFuture && form.publishedAt && (
                          <p className="text-[11px] text-amber-600 mt-1">⚠ Select a future date to schedule.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Publish Time</label>
                        <input type="time" value={form.publishTime} onChange={(e) => set("publishTime", e.target.value)}
                          className={inputCls} />
                      </div>
                    </div>
                    {isFuture && (
                      <p className="text-[11px] text-indigo-600 font-medium">
                        Will go live: {formatDateDisplay(form.publishedAt)} at {form.publishTime}
                      </p>
                    )}
                  </div>
                )}

                {form.status === "draft" && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex gap-2">
                    <FileEdit size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600">
                      Saved as a <strong>draft</strong>. Not visible to the public. You can publish or schedule it later by editing this article.
                    </p>
                  </div>
                )}
              </div>

              {/* Featured */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-amber-300 transition-colors">
                <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)}
                  className="w-4 h-4 rounded" />
                <div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                    <Star size={13} className="text-amber-500" /> Featured Article
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Featured articles are highlighted prominently on the public news page and homepage.
                  </p>
                </div>
              </label>

              {/* URL preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex gap-2">
                <Globe size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500">
                  Public URL:{" "}
                  <span className="font-mono text-gray-700 font-medium">
                    /news/{form.slug || "article-slug"}
                  </span>
                </p>
              </div>
            </>)}

            {/* ── STEP 4 ── */}
            {step === 4 && (<>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                  <ImageIcon size={13} className="text-gray-400" /> Cover Image
                  <span className="text-gray-400 font-normal text-xs">optional</span>
                </label>
                <p className="text-[11px] text-gray-400 mb-2">
                  Shown as the article thumbnail and hero image. Recommended: 1200 × 630 px (16:9).
                </p>
                <ImageUpload value={form.image} onChange={(url) => set("image", url)} />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                  <ImageIcon size={13} className="text-gray-400" /> Gallery
                  <span className="text-gray-400 font-normal text-xs">optional, up to 6</span>
                </label>
                <p className="text-[11px] text-gray-400 mb-2">
                  Additional photos shown on the article page alongside the cover image.
                </p>
                <MultiImageUpload values={galleryImages} onChange={setGalleryImages} max={6} />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                  <Globe size={13} className="text-gray-400" /> External Link
                  <span className="text-gray-400 font-normal text-xs">optional</span>
                </label>
                <p className="text-[11px] text-gray-400 mb-2">
                  A related link — source article, registration page, etc. — shown as a button on the article page.
                </p>
                <input
                  type="url"
                  value={form.externalLink}
                  onChange={(e) => set("externalLink", e.target.value)}
                  placeholder="https://…"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                />
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Review Before Saving</p>
                <div className="space-y-2.5">
                  {([
                    ["Title",     form.title        || "—"],
                    ["Slug",      form.slug ? `news/${form.slug}` : "—"],
                    ["Category",  selectedCategory?.label ?? "—"],
                    ["Author",    form.author       || "—"],
                    ["Status",    form.status === "draft" ? "Draft (not public)" : form.status === "scheduled" ? `Scheduled for ${formatDateDisplay(form.publishedAt)} ${form.publishTime}` : `Publishing now (${formatDateDisplay(form.publishedAt)})`],
                    ["Featured",  form.featured ? "Yes — highlighted on homepage" : "No"],
                    ["Excerpt",   form.excerpt ? `${form.excerpt.slice(0, 60)}${form.excerpt.length > 60 ? "…" : ""}` : "—"],
                    ["Content",   form.content ? `${form.content.split(/\s+/).filter(Boolean).length} words` : "—"],
                    ["Cover",     form.image ? "Uploaded" : "None"],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-gray-400">{label}</span>
                      <span className="font-medium text-gray-700 text-right max-w-[65%] truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!form.title && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-2">
                  <Info size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">Article title is missing. Go back to Step 1.</p>
                </div>
              )}
            </>)}

          </motion.div>
        </AnimatePresence>

        {/* Error banner */}
        {error && (
          <div className="mx-4 sm:mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex gap-2">
            <Info size={14} className="flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {/* Footer nav */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button type="button" onClick={goBack} disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl hover:bg-gray-100 transition-colors min-h-[44px]">
            <ChevronLeft size={15} /> Back
          </button>
          <span className="text-xs text-gray-400">{step}/{STEPS.length}</span>
          {step < 4 ? (
            <button type="button" onClick={goNext}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0a1040] text-white text-sm font-medium rounded-xl hover:bg-[#0d1550] shadow-sm transition-colors min-h-[44px]">
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={saving || !form.title}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-white text-sm font-medium rounded-xl disabled:opacity-50 shadow-sm transition-colors min-h-[44px] ${
                form.status === "draft" ? "bg-gray-600 hover:bg-gray-700"
                : form.status === "scheduled" ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-emerald-600 hover:bg-emerald-700"
              }`}>
              {submitLabel()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
