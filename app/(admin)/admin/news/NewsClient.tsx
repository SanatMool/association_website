"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Newspaper, Star, Search, ArrowUpDown } from "lucide-react";
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

export default function NewsClient({ articles }: { articles: NewsRow[] }) {
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState("all");
  const [sortKey,    setSortKey]    = useState<SortKey>("date");
  const [sortAsc,    setSortAsc]    = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const filtered = articles
    .filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        q === "" ||
        a.title.toLowerCase().includes(q) ||
        (a.author ?? "").toLowerCase().includes(q);
      const matchesCat = catFilter === "all" || a.category === catFilter;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date")     cmp = a.publishedAt.localeCompare(b.publishedAt);
      if (sortKey === "title")    cmp = a.title.localeCompare(b.title);
      if (sortKey === "author")   cmp = (a.author ?? "").localeCompare(b.author ?? "");
      if (sortKey === "category") cmp = a.category.localeCompare(b.category);
      return sortAsc ? cmp : -cmp;
    });

  function SortBtn({ col, label }: { col: SortKey; label: string }) {
    return (
      <button
        onClick={() => toggleSort(col)}
        className="flex items-center gap-1 group hover:text-gray-700 transition-colors"
      >
        {label}
        <ArrowUpDown
          size={11}
          className={`transition-colors ${sortKey === col ? "text-[#0a1040]" : "text-gray-300 group-hover:text-gray-400"}`}
        />
      </button>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">News</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} of {articles.length} article{articles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/news/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] transition-colors"
        >
          <Plus size={14} />
          Add article
        </Link>
      </div>

      {/* Search + category filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCatFilter("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${catFilter === "all" ? "bg-[#0a1040] text-white border-[#0a1040]" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(catFilter === cat ? "all" : cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border capitalize transition-colors ${
                catFilter === cat
                  ? (CATEGORY_STYLES[cat] ?? "bg-gray-100 text-gray-600 border-gray-200") + " ring-2 ring-offset-1 ring-amber-400"
                  : (CATEGORY_STYLES[cat] ?? "bg-gray-50 text-gray-500 border-gray-200") + " opacity-70 hover:opacity-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Newspaper size={22} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">No articles yet</p>
            <p className="text-xs text-gray-400 mb-4">Add your first news article to get started.</p>
            <Link
              href="/admin/news/new"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0a1040] text-white text-xs rounded-lg hover:bg-[#0d1550] transition-colors"
            >
              <Plus size={12} /> Add article
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-8" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <SortBtn col="title" label="Title" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <SortBtn col="category" label="Category" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  <SortBtn col="author" label="Author" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  <SortBtn col="date" label="Published" />
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    No articles match your search.
                  </td>
                </tr>
              )}
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/50">
                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {a.image ? (
                        <img src={a.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper size={12} className="text-gray-300" />
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
                  <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate hidden sm:table-cell">
                    {a.author ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden md:table-cell">
                    {formatDate(a.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/news/${a.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <Pencil size={11} />
                        Edit
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
