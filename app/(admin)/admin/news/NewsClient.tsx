"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus, Pencil, Newspaper, Star, Search, X,
  ChevronUp, ChevronDown, ChevronsUpDown,
  CalendarDays, User, SlidersHorizontal,
  Clock, CheckCircle2, FileEdit,
} from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";
import { formatDate } from "@/lib/utils";

export interface NewsRow {
  id: string;
  title: string;
  category: string;
  author: string | null;
  publishedAt: string;
  featured: boolean;
  image: string | null;
  slug: string;
  status: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  announcement: "bg-blue-50 text-blue-700 border-blue-200",
  training:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  event:        "bg-amber-50 text-amber-700 border-amber-200",
  industry:     "bg-purple-50 text-purple-700 border-purple-200",
  member:       "bg-rose-50 text-rose-700 border-rose-200",
};

const CATEGORIES = ["announcement", "training", "event", "industry", "member"];
type SortKey = "date" | "title" | "author" | "category";

function statusBadge(row: NewsRow) {
  const isFuture = new Date(row.publishedAt) > new Date();
  if (row.status === "draft") {
    return <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border bg-gray-50 text-gray-500 border-gray-200"><FileEdit size={9} /> Draft</span>;
  }
  if (row.status === "scheduled" || isFuture) {
    return <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border bg-indigo-50 text-indigo-600 border-indigo-200"><Clock size={9} /> Scheduled</span>;
  }
  return <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border bg-green-50 text-green-700 border-green-200"><CheckCircle2 size={9} /> Published</span>;
}

function SortIcon({ col, sortKey, sortAsc }: { col: SortKey; sortKey: SortKey; sortAsc: boolean }) {
  if (sortKey !== col) return <ChevronsUpDown size={12} className="text-gray-300" />;
  return sortAsc ? <ChevronUp size={12} className="text-amber-500" /> : <ChevronDown size={12} className="text-amber-500" />;
}

const STATUS_FILTERS = ["all", "published", "scheduled", "draft"] as const;

export default function NewsClient({ articles }: { articles: NewsRow[] }) {
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusF,   setStatusF]   = useState<typeof STATUS_FILTERS[number]>("all");
  const [sortKey,   setSortKey]   = useState<SortKey>("date");
  const [sortAsc,   setSortAsc]   = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const effectiveStatus = (row: NewsRow) => {
    if (row.status === "draft") return "draft";
    if (row.status === "scheduled" || new Date(row.publishedAt) > new Date()) return "scheduled";
    return "published";
  };

  const filtered = useMemo(() => {
    let rows = articles.filter((a) => {
      const q = search.toLowerCase();
      if (q && !a.title.toLowerCase().includes(q) && !(a.author ?? "").toLowerCase().includes(q)) return false;
      if (catFilter !== "all" && a.category !== catFilter) return false;
      if (statusF !== "all" && effectiveStatus(a) !== statusF) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date")     cmp = a.publishedAt.localeCompare(b.publishedAt);
      if (sortKey === "title")    cmp = a.title.localeCompare(b.title);
      if (sortKey === "author")   cmp = (a.author ?? "").localeCompare(b.author ?? "");
      if (sortKey === "category") cmp = a.category.localeCompare(b.category);
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [articles, search, catFilter, statusF, sortKey, sortAsc]);

  const publishedCount  = articles.filter((a) => effectiveStatus(a) === "published").length;
  const scheduledCount  = articles.filter((a) => effectiveStatus(a) === "scheduled").length;
  const draftCount      = articles.filter((a) => effectiveStatus(a) === "draft").length;
  const anyFilter       = search || catFilter !== "all" || statusF !== "all";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Newspaper size={22} className="text-indigo-500" />
            News
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{articles.length} total</span>
            <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={11} /> {publishedCount} published</span>
            {scheduledCount > 0 && <span className="flex items-center gap-1 text-indigo-500"><Clock size={11} /> {scheduledCount} scheduled</span>}
            {draftCount > 0 && <span className="flex items-center gap-1 text-gray-400"><FileEdit size={11} /> {draftCount} draft</span>}
          </p>
        </div>
        <Link
          href="/admin/news/new"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm rounded-xl hover:bg-[#0d1550] transition-colors w-full sm:w-auto"
        >
          <Plus size={14} /> Add article
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or author…"
            className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status + Category filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <SlidersHorizontal size={13} className="text-gray-400 flex-shrink-0" />
          {/* Status */}
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button key={s} onClick={() => setStatusF(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                  statusF === s ? "bg-[#0a1040] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}>
                {s === "all" ? "All Status" : s}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-gray-200 hidden sm:block" />
          {/* Category */}
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setCatFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${catFilter === "all" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              All Types
            </button>
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCatFilter(catFilter === cat ? "all" : cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                  catFilter === cat
                    ? (CATEGORY_STYLES[cat] ?? "bg-gray-100 text-gray-600") + " border"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}>
                {cat}
              </button>
            ))}
          </div>
          {anyFilter && (
            <button onClick={() => { setSearch(""); setCatFilter("all"); setStatusF("all"); }}
              className="ml-auto text-xs text-red-500 hover:text-red-700 underline">
              Clear
            </button>
          )}
        </div>
      </div>

      {anyFilter && (
        <p className="text-xs text-gray-400 mb-3">
          Showing <strong className="text-gray-700">{filtered.length}</strong> of {articles.length} articles
        </p>
      )}

      {/* ── Mobile cards (hidden md+) ── */}
      <div className="md:hidden bg-white rounded-xl border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Newspaper size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              {articles.length === 0 ? "No articles yet. Tap \"Add article\" to create one." : "No articles match your filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((a) => (
              <div key={a.id} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {a.image ? (
                      <img src={a.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Newspaper size={16} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 flex items-center gap-1">
                        {a.featured && <Star size={11} className="text-amber-500 flex-shrink-0" fill="currentColor" />}
                        {a.title}
                      </p>
                      {statusBadge(a)}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={10} /> {formatDate(a.publishedAt)}
                      </span>
                      {a.author && (
                        <span className="flex items-center gap-1">
                          <User size={10} /> {a.author}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 text-[11px] rounded-full border capitalize ${CATEGORY_STYLES[a.category] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                        {a.category}
                      </span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <Link href={`/admin/news/${a.id}`}
                          className="flex items-center gap-1 px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 min-h-[36px]">
                          <Pencil size={11} /> Edit
                        </Link>
                        <DeleteButton id={a.id} entity="news" redirectTo="/admin/news" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop table (hidden below md) ── */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Newspaper size={22} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">No articles yet</p>
            <p className="text-xs text-gray-400 mb-4">Add your first news article to get started.</p>
            <Link href="/admin/news/new"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0a1040] text-white text-xs rounded-lg hover:bg-[#0d1550] transition-colors">
              <Plus size={12} /> Add article
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 w-10" />
                <th className="text-left px-4 py-3 text-gray-500 font-medium">
                  <button onClick={() => toggleSort("title")} className="flex items-center gap-1 hover:text-gray-800">
                    <Newspaper size={12} /> Title <SortIcon col="title" sortKey={sortKey} sortAsc={sortAsc} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">
                  <button onClick={() => toggleSort("category")} className="flex items-center gap-1 hover:text-gray-800">
                    Category <SortIcon col="category" sortKey={sortKey} sortAsc={sortAsc} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">
                  <button onClick={() => toggleSort("author")} className="flex items-center gap-1 hover:text-gray-800">
                    <User size={12} /> Author <SortIcon col="author" sortKey={sortKey} sortAsc={sortAsc} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">
                  <button onClick={() => toggleSort("date")} className="flex items-center gap-1 hover:text-gray-800">
                    <CalendarDays size={12} /> Date <SortIcon col="date" sortKey={sortKey} sortAsc={sortAsc} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                    No articles match your search.
                  </td>
                </tr>
              )}
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {a.image ? (
                        <img src={a.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper size={13} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="flex items-center gap-1.5">
                      {a.featured && <Star size={11} className="text-amber-500 flex-shrink-0" fill="currentColor" />}
                      <span className="font-medium text-gray-900 truncate">{a.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs border rounded-full capitalize ${CATEGORY_STYLES[a.category] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                      {a.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate hidden lg:table-cell">
                    {a.author ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(a.publishedAt)}
                  </td>
                  <td className="px-4 py-3">{statusBadge(a)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/admin/news/${a.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <Pencil size={11} /> Edit
                      </Link>
                      <DeleteButton id={a.id} entity="news" redirectTo="/admin/news" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
