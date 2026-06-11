"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { News } from "@prisma/client";
import ImageUpload from "./ImageUpload";
import {
  FileText, AlignLeft, CalendarDays, Image as ImageIcon,
  ChevronRight, ChevronLeft, Check, Info, Star, Loader2,
  Globe, User, Sparkles,
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
  { id: 3, label: "Details",        icon: CalendarDays,  hint: "Author, date, and visibility" },
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

// ─── Component ────────────────────────────────────────────────────────────────

interface Props { article?: News }

export default function NewsForm({ article }: Props) {
  const router = useRouter();
  const [step,   setStep]   = useState(1);
  const [dir,    setDir]    = useState(1);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiError,    setAiError]    = useState("");
  const [aiKeywords, setAiKeywords] = useState("");

  const toDateInput = (d: Date | null | undefined) =>
    d ? new Date(d).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    title:       article?.title       ?? "",
    titleNe:     article?.titleNe     ?? "",
    slug:        article?.slug        ?? "",
    excerpt:     article?.excerpt     ?? "",
    content:     article?.content     ?? "",
    author:      article?.author      ?? "",
    category:    article?.category    ?? "announcement",
    publishedAt: toDateInput(article?.publishedAt),
    featured:    article?.featured    ?? false,
    image:       article?.image       ?? "",
  });

  function set(key: string, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-slug from title when creating new
      if (key === "title" && !article) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  }

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
      setForm((p) => ({ ...p, excerpt: json.data!.excerpt, content: json.data!.content }));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
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
      if (!isValidDate(form.publishedAt)) return "Please enter a valid published date.";
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

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition";

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

      {/* ── Card ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
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
            className="px-6 py-6 space-y-5"
          >

            {/* ── STEP 1 ─────────────────────────────────────────────────────── */}
            {step === 1 && (<>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Start with the official article title — exactly as it should appear on the public news page.
                  The URL slug is auto-filled from the title.
                </p>
              </div>

              {/* Title EN */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Article Title (English) *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. EVA Nepal Hosts Annual Member Summit 2081"
                  className={inputCls}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Shown as the main headline on the news card and article page.
                </p>
              </div>

              {/* Title NE */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Title (Nepali) <span className="text-gray-400 font-normal text-xs">optional</span>
                </label>
                <input
                  value={form.titleNe}
                  onChange={(e) => set("titleNe", e.target.value)}
                  placeholder="नेपालीमा शीर्षक (ऐच्छिक)"
                  className={inputCls}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Shown when the site language is switched to Nepali.
                </p>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  URL Slug *{" "}
                  <span title="Auto-filled from the title. Used in the public article URL." className="inline-flex text-gray-400 cursor-help ml-0.5">
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
                <p className="text-[11px] text-gray-400 mt-1">
                  Lowercase letters, numbers, and hyphens only. Auto-filled from the title above.
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <p className="text-[11px] text-gray-400 mb-3">
                  Choose the type of article. Shown as a coloured badge on the news card.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => set("category", c.value)}
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

            {/* ── STEP 2 ─────────────────────────────────────────────────────── */}
            {step === 2 && (<>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  The excerpt appears as the preview text on the news listing page.
                  Keep it to 1–2 sentences that hook the reader. The full content appears on the article page.
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
                    placeholder="e.g. annual meeting, 150 venues, training workshop, Kathmandu"
                    className="w-full px-3 py-2 border border-violet-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <p className="text-[11px] text-violet-500 mt-1">Add key points or facts to include. The AI will weave them into the article.</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-violet-600 font-medium truncate max-w-[60%]">
                    {form.title || <span className="text-violet-400">Enter a title in Step 1 first</span>}
                  </p>
                  <button
                    type="button"
                    onClick={generateWithAI}
                    disabled={!form.title || aiLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {aiLoading
                      ? <><Loader2 size={11} className="animate-spin" /> Generating…</>
                      : <><Sparkles size={11} /> Generate Article</>}
                  </button>
                </div>
              </div>
              {aiError && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                  {aiError}
                </div>
              )}

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Short Excerpt / Summary *
                </label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => set("excerpt", e.target.value)}
                  rows={3}
                  placeholder="A brief 1–2 sentence summary of the article, shown on the news listing page…"
                  className={`${inputCls} resize-none`}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-gray-400">Shown on the news card as the preview description.</p>
                  <span className={`text-[11px] font-medium ${form.excerpt.length > 200 ? "text-amber-600" : "text-gray-400"}`}>
                    {form.excerpt.length} chars
                  </span>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Full Article Content *
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => set("content", e.target.value)}
                  rows={10}
                  placeholder="Write the full article here. You can use plain text or include line breaks for paragraphs…"
                  className={`${inputCls} resize-y`}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-gray-400">
                    Displayed on the full article page. Use blank lines to separate paragraphs.
                  </p>
                  <span className={`text-[11px] font-medium ${form.content.length > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                    {form.content.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
              </div>
            </>)}

            {/* ── STEP 3 ─────────────────────────────────────────────────────── */}
            {step === 3 && (<>
              {/* Author */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                  <User size={13} className="text-gray-400" /> Author *
                </label>
                <input
                  value={form.author}
                  onChange={(e) => set("author", e.target.value)}
                  placeholder="e.g. EVA Nepal Secretariat, or the author's name"
                  className={inputCls}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Shown below the article title. Use &ldquo;EVA Nepal Secretariat&rdquo; for official communications.
                </p>
              </div>

              {/* Published date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Published Date *
                </label>
                <input
                  type="date"
                  value={form.publishedAt}
                  onChange={(e) => set("publishedAt", e.target.value)}
                  className={inputCls}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  The date shown publicly on the article. News is sorted by this date — most recent first.
                </p>
                {form.publishedAt && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                    Will appear as: {formatDateDisplay(form.publishedAt)}
                  </p>
                )}
              </div>

              {/* Featured */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-amber-300 transition-colors">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                    <Star size={13} className="text-amber-500" /> Featured Article
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Featured articles are highlighted prominently on the public news page and homepage.
                  </p>
                </div>
              </label>

              {/* Website / external link note */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex gap-2">
                <Globe size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500">
                  The public URL for this article will be:{" "}
                  <span className="font-mono text-gray-700 font-medium">
                    /news/{form.slug || "article-slug"}
                  </span>
                </p>
              </div>
            </>)}

            {/* ── STEP 4 ─────────────────────────────────────────────────────── */}
            {step === 4 && (<>
              {/* Cover image */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Cover Image <span className="text-gray-400 font-normal text-xs">optional</span>
                </label>
                <p className="text-[11px] text-gray-400 mb-2">
                  Shown as the article thumbnail on the news listing and as the hero image on the article page.
                  Recommended: 1200 × 630 px (16:9).
                </p>
                <ImageUpload value={form.image} onChange={(url) => set("image", url)} />
              </div>

              {/* Summary review */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Review Before Saving
                </p>
                <div className="space-y-2.5">
                  {([
                    ["Title",        form.title        || "—"],
                    ["Slug",         form.slug ? `news/${form.slug}` : "—"],
                    ["Category",     selectedCategory?.label ?? "—"],
                    ["Author",       form.author       || "—"],
                    ["Published",    formatDateDisplay(form.publishedAt)],
                    ["Featured",     form.featured ? "Yes — highlighted on homepage" : "No"],
                    ["Excerpt",      form.excerpt ? `${form.excerpt.slice(0, 60)}${form.excerpt.length > 60 ? "…" : ""}` : "—"],
                    ["Content",      form.content ? `${form.content.split(/\s+/).filter(Boolean).length} words` : "—"],
                    ["Cover Image",  form.image ? "Uploaded" : "None"],
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
                  <p className="text-xs text-red-600">
                    Article title is missing. Go back to Step 1 to fix this before saving.
                  </p>
                </div>
              )}
            </>)}

          </motion.div>
        </AnimatePresence>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex gap-2">
            <Info size={14} className="flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {/* Footer nav */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={15} /> Back
          </button>
          <span className="text-xs text-gray-400">{step}/{STEPS.length}</span>
          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#0a1040] text-white text-sm font-medium rounded-lg hover:bg-[#0d1550] shadow-sm transition-colors"
            >
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !form.title}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              {saving
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : <><Check size={15} /> {article ? "Update Article" : "Publish Article"}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
