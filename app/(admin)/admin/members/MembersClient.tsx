"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";
import VisibilityToggle from "@/components/admin/VisibilityToggle";

export interface MemberRow {
  id: string; memberId: string; name: string; area: string;
  capacity: number | null; category: string | null; type: string | null;
  phone: string | null; email: string | null;
  featured: boolean; visible: boolean;
}

type SortKey = "name" | "area" | "capacity";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

export default function MembersClient({ rows, totalCount }: { rows: MemberRow[]; totalCount: number }) {
  const [search,      setSearch]      = useState("");
  const [filterArea,  setFilterArea]  = useState("");
  const [filterCat,   setFilterCat]   = useState("");
  const [filterVis,   setFilterVis]   = useState<"all" | "visible" | "hidden">("all");
  const [filterFeat,  setFilterFeat]  = useState(false);
  const [sortKey,     setSortKey]     = useState<SortKey>("name");
  const [sortDir,     setSortDir]     = useState<SortDir>("asc");
  const [page,        setPage]        = useState(1);

  const areas      = useMemo(() => Array.from(new Set(rows.map((r) => r.area).filter(Boolean))).sort(), [rows]);
  const categories = useMemo(() =>
    Array.from(new Set(
      rows.flatMap((r) => (r.category ?? "").split(",").map((s) => s.trim())).filter(Boolean)
    )).sort()
  , [rows]);

  const filtered = useMemo(() => {
    let out = rows;
    const q = search.trim().toLowerCase();
    if (q)             out = out.filter((r) => r.name.toLowerCase().includes(q) || r.area.toLowerCase().includes(q) || (r.phone ?? "").includes(q));
    if (filterArea)    out = out.filter((r) => r.area === filterArea);
    if (filterCat)     out = out.filter((r) => (r.category ?? "").split(",").map((s) => s.trim()).includes(filterCat));
    if (filterVis === "visible") out = out.filter((r) => r.visible);
    if (filterVis === "hidden")  out = out.filter((r) => !r.visible);
    if (filterFeat)    out = out.filter((r) => r.featured);
    return out;
  }, [rows, search, filterArea, filterCat, filterVis, filterFeat]);

  const sorted = useMemo(() => {
    const s = [...filtered];
    s.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name")     cmp = a.name.localeCompare(b.name);
      if (sortKey === "area")     cmp = a.area.localeCompare(b.area);
      if (sortKey === "capacity") cmp = (a.capacity ?? 0) - (b.capacity ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return s;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronsUpDown size={12} className="text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-indigo-500" /> : <ChevronDown size={12} className="text-indigo-500" />;
  }

  const visibleCount = rows.filter((r) => r.visible).length;
  const hiddenCount  = rows.length - visibleCount;

  const selectCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white";

  return (
    <div>
      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-400">
        <span>{totalCount} total</span>
        <span className="text-green-600">{visibleCount} visible</span>
        <span className="text-gray-400">{hiddenCount} hidden</span>
        {filtered.length !== totalCount && (
          <span className="text-indigo-600 font-medium">{filtered.length} matching filters</span>
        )}
      </div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, area, phone…"
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
        </div>

        {/* Area filter */}
        <select value={filterArea} onChange={(e) => { setFilterArea(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All Areas</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Category filter */}
        <select value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Visibility filter */}
        <select value={filterVis} onChange={(e) => { setFilterVis(e.target.value as "all" | "visible" | "hidden"); setPage(1); }} className={selectCls}>
          <option value="all">All Visibility</option>
          <option value="visible">Visible only</option>
          <option value="hidden">Hidden only</option>
        </select>

        {/* Featured toggle */}
        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={filterFeat} onChange={(e) => { setFilterFeat(e.target.checked); setPage(1); }} className="rounded" />
          Featured only
        </label>

        {/* Clear */}
        {(search || filterArea || filterCat || filterVis !== "all" || filterFeat) && (
          <button onClick={() => { setSearch(""); setFilterArea(""); setFilterCat(""); setFilterVis("all"); setFilterFeat(false); setPage(1); }}
            className="text-xs text-red-500 hover:text-red-700 underline">
            Clear filters
          </button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {paged.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No members match the current filters.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3">
                  <button onClick={() => toggleSort("name")}
                    className="flex items-center gap-1 text-gray-500 font-medium hover:text-gray-800">
                    Name <SortIcon k="name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => toggleSort("area")}
                    className="flex items-center gap-1 text-gray-500 font-medium hover:text-gray-800">
                    Area <SortIcon k="area" />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => toggleSort("capacity")}
                    className="flex items-center gap-1 text-gray-500 font-medium hover:text-gray-800">
                    Capacity <SortIcon k="capacity" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Category</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Visibility</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Featured</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map((m) => (
                <tr key={m.id} className={`hover:bg-gray-50/50 ${!m.visible ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                  <td className="px-4 py-3 text-gray-500">{m.area}</td>
                  <td className="px-4 py-3 text-gray-500">{m.capacity ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{m.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    <VisibilityToggle memberId={m.memberId} visible={m.visible} />
                  </td>
                  <td className="px-4 py-3">
                    {m.featured && (
                      <span className="px-2 py-0.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full">Featured</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/admin/members/${m.memberId}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <Pencil size={11} /> Edit
                      </Link>
                      <DeleteButton id={m.memberId} entity="members" redirectTo="/admin/members" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Pagination ───────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-400">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (arr[idx - 1] as number) !== p - 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p as number)}
                      className={`w-7 h-7 rounded text-xs font-medium transition-colors
                        ${currentPage === p ? "bg-indigo-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                      {p}
                    </button>
                  )
                )}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
