"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Pencil, AlertTriangle, BadgeDollarSign, Building2, MapPin, Users, Tag, ShieldCheck, Eye, EyeOff, Star, Download } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";
import VisibilityToggle from "@/components/admin/VisibilityToggle";
import { useRouter } from "next/navigation";
import PanelCard from "@/components/ui/panel/PanelCard";
import { PanelTable, PanelTableHead, PanelTableRow } from "@/components/ui/panel/PanelTable";
import Badge from "@/components/ui/panel/Badge";

export interface MemberRow {
  id: string; memberId: string; name: string; area: string;
  capacity: number | null; category: string | null; type: string | null;
  phone: string | null; email: string | null;
  featured: boolean; visible: boolean;
  missingFields: string[];
  pendingDues: number;
}

type SortKey = "name" | "area" | "capacity";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

export default function MembersClient({ rows, totalCount, memberMode = "venue" }: { rows: MemberRow[]; totalCount: number; memberMode?: "venue" | "person" }) {
  const isPersonMode = memberMode === "person";
  const areaLabel = isPersonMode ? "Location" : "Area";
  const categoryLabel = isPersonMode ? "Profession" : "Category";
  const router = useRouter();
  const [search,         setSearch]         = useState("");
  const [filterArea,     setFilterArea]      = useState("");
  const [filterCat,      setFilterCat]       = useState("");
  const [filterVis,      setFilterVis]       = useState<"all" | "visible" | "hidden">("all");
  const [filterFeat,     setFilterFeat]      = useState(false);
  const [filterIncomplete, setFilterIncomplete] = useState(false);
  const [filterPending,  setFilterPending]   = useState(false);
  const [sortKey,     setSortKey]     = useState<SortKey>("name");
  const [sortDir,     setSortDir]     = useState<SortDir>("asc");
  const [page,        setPage]        = useState(1);
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const areas      = useMemo(() => Array.from(new Set(rows.map((r) => r.area).filter(Boolean))).sort(), [rows]);
  const categories = useMemo(() =>
    Array.from(new Set(
      rows.flatMap((r) => (r.category ?? "").split(",").map((s) => s.trim())).filter(Boolean)
    )).sort()
  , [rows]);

  const filtered = useMemo(() => {
    let out = rows;
    const q = search.trim().toLowerCase();
    if (q)                out = out.filter((r) => r.name.toLowerCase().includes(q) || r.area.toLowerCase().includes(q) || (r.phone ?? "").includes(q));
    if (filterArea)       out = out.filter((r) => r.area === filterArea);
    if (filterCat)        out = out.filter((r) => (r.category ?? "").split(",").map((s) => s.trim()).includes(filterCat));
    if (filterVis === "visible") out = out.filter((r) => r.visible);
    if (filterVis === "hidden")  out = out.filter((r) => !r.visible);
    if (filterFeat)       out = out.filter((r) => r.featured);
    if (filterIncomplete) out = out.filter((r) => r.missingFields.length > 0);
    if (filterPending)    out = out.filter((r) => r.pendingDues > 0);
    return out;
  }, [rows, search, filterArea, filterCat, filterVis, filterFeat, filterIncomplete, filterPending]);

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

  const pageIds = paged.map((m) => m.memberId);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  function togglePageSelect() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) { pageIds.forEach((id) => next.delete(id)); }
      else { pageIds.forEach((id) => next.add(id)); }
      return next;
    });
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const bulkSetVisibility = useCallback(async (visible: boolean) => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    await fetch("/api/members/bulk-visibility", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberIds: Array.from(selected), visible }),
    });
    setSelected(new Set());
    setBulkLoading(false);
    router.refresh();
  }, [selected, router]);

  // Infinite scroll — advance page when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && currentPage < totalPages) setPage((p) => p + 1); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [currentPage, totalPages]);

  function exportCsv() {
    const header = isPersonMode
      ? ["Name", "Location", "Profession", "Type", "Phone", "Email", "Visible", "Featured", "Pending Dues (Rs)"]
      : ["Name", "Area", "Capacity", "Category", "Type", "Phone", "Email", "Visible", "Featured", "Pending Dues (Rs)"];
    const rowsData = sorted.map((r) => [
      r.name, r.area,
      ...(isPersonMode ? [] : [r.capacity ?? ""]),
      r.category ?? "", r.type ?? "",
      r.phone ?? "", r.email ?? "",
      r.visible ? "Yes" : "No",
      r.featured ? "Yes" : "No",
      r.pendingDues > 0 ? r.pendingDues : "",
    ]);
    const csvContent = [header, ...rowsData]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronsUpDown size={12} className="text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-indigo-500" /> : <ChevronDown size={12} className="text-indigo-500" />;
  }

  const visibleCount    = rows.filter((r) => r.visible).length;
  const hiddenCount     = rows.length - visibleCount;
  const incompleteCount = rows.filter((r) => r.missingFields.length > 0).length;
  const pendingCount    = rows.filter((r) => r.pendingDues > 0).length;

  const selectCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white";

  return (
    <div>
      {/* ── Stats + Export ───────────────────────────────────────────── */}
      <div className="flex items-center flex-wrap gap-4 mb-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">{isPersonMode ? <Users size={11} /> : <Building2 size={11} />} {totalCount} total</span>
        <span className="flex items-center gap-1 text-green-600"><Eye size={11} /> {visibleCount} visible</span>
        <span className="flex items-center gap-1 text-gray-400"><Eye size={11} className="opacity-40" /> {hiddenCount} hidden</span>
        {incompleteCount > 0 && (
          <span className="text-amber-600 font-medium flex items-center gap-1">
            <AlertTriangle size={11} /> {incompleteCount} incomplete profile{incompleteCount !== 1 ? "s" : ""}
          </span>
        )}
        {pendingCount > 0 && (
          <span className="text-red-500 font-medium flex items-center gap-1">
            <BadgeDollarSign size={11} /> {pendingCount} with pending dues
          </span>
        )}
        {filtered.length !== totalCount && (
          <span className="text-indigo-600 font-medium">{filtered.length} matching filters</span>
        )}
        <button
          onClick={exportCsv}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Download size={12} /> Export CSV
        </button>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <PanelCard className="p-4 mb-4 space-y-3" hover={false}>
        {/* Row 1: search + selects */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={`Search name, ${areaLabel.toLowerCase()}, phone…`}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
          </div>
          <select value={filterArea} onChange={(e) => { setFilterArea(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">All {areaLabel}s</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">All {categoryLabel}s</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterVis} onChange={(e) => { setFilterVis(e.target.value as "all" | "visible" | "hidden"); setPage(1); }} className={selectCls}>
            <option value="all">All Visibility</option>
            <option value="visible">Visible only</option>
            <option value="hidden">Hidden only</option>
          </select>
        </div>

        {/* Row 2: toggles + clear */}
        <div className="flex items-center gap-5 pt-1 border-t border-gray-100">
          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={filterFeat} onChange={(e) => { setFilterFeat(e.target.checked); setPage(1); }} className="rounded" />
            Featured only
          </label>
          <label className="flex items-center gap-1.5 text-sm text-amber-600 cursor-pointer select-none">
            <input type="checkbox" checked={filterIncomplete} onChange={(e) => { setFilterIncomplete(e.target.checked); setPage(1); }} className="rounded" />
            Incomplete only
          </label>
          <label className="flex items-center gap-1.5 text-sm text-red-500 cursor-pointer select-none">
            <input type="checkbox" checked={filterPending} onChange={(e) => { setFilterPending(e.target.checked); setPage(1); }} className="rounded" />
            Pending dues only
          </label>
          {(search || filterArea || filterCat || filterVis !== "all" || filterFeat || filterIncomplete || filterPending) && (
            <button
              onClick={() => { setSearch(""); setFilterArea(""); setFilterCat(""); setFilterVis("all"); setFilterFeat(false); setFilterIncomplete(false); setFilterPending(false); setPage(1); }}
              className="ml-auto text-xs text-red-500 hover:text-red-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </PanelCard>

      {/* ── Bulk action bar ──────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5">
          <span className="text-sm font-medium text-indigo-800">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => bulkSetVisibility(true)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              <Eye size={12} /> Show all
            </button>
            <button
              onClick={() => bulkSetVisibility(false)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-60 transition-colors"
            >
              <EyeOff size={12} /> Hide all
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium px-2"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────── */}
      <PanelTable>
        {paged.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No members match the current filters.</div>
        ) : (
          <table className="w-full text-sm">
            <PanelTableHead>
              <tr>
                <th className="w-8 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={togglePageSelect}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                    title="Select all on this page"
                  />
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => toggleSort("name")}
                    className="flex items-center gap-1 text-gray-500 font-medium hover:text-gray-800">
                    {isPersonMode ? <Users size={12} /> : <Building2 size={12} />} Name <SortIcon k="name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => toggleSort("area")}
                    className="flex items-center gap-1 text-gray-500 font-medium hover:text-gray-800">
                    <MapPin size={12} /> {areaLabel} <SortIcon k="area" />
                  </button>
                </th>
                {!isPersonMode && (
                  <th className="text-left px-4 py-3">
                    <button onClick={() => toggleSort("capacity")}
                      className="flex items-center gap-1 text-gray-500 font-medium hover:text-gray-800">
                      <Users size={12} /> Capacity <SortIcon k="capacity" />
                    </button>
                  </th>
                )}
                <th className="text-left px-4 py-3 text-gray-500 font-medium">
                  <span className="flex items-center gap-1"><Tag size={12} /> {categoryLabel}</span>
                </th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">
                  <span className="flex items-center gap-1"><ShieldCheck size={12} /> Profile</span>
                </th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">
                  <span className="flex items-center gap-1"><BadgeDollarSign size={12} /> Dues</span>
                </th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">
                  <span className="flex items-center gap-1"><Eye size={12} /> Visibility</span>
                </th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">
                  <span className="flex items-center gap-1"><Star size={12} /> Featured</span>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </PanelTableHead>
            <tbody className="divide-y divide-gray-50">
              {paged.map((m, i) => (
                <PanelTableRow key={m.id} index={i} className={`${!m.visible ? "opacity-60" : ""} ${selected.has(m.memberId) ? "bg-indigo-50/40" : ""}`}>
                  <td className="w-8 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(m.memberId)}
                      onChange={() => toggleRow(m.memberId)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                  <td className="px-4 py-3 text-gray-500">{m.area}</td>
                  {!isPersonMode && <td className="px-4 py-3 text-gray-500">{m.capacity ?? "—"}</td>}
                  <td className="px-4 py-3 text-gray-500">{m.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    {m.missingFields.length > 0 ? (
                      <div className="relative group inline-block">
                        <Badge tone="warning" icon={<AlertTriangle size={11} />} className="cursor-help">
                          {m.missingFields.length} missing
                        </Badge>
                        <div className="absolute left-0 top-full mt-1 z-20 hidden group-hover:block w-max max-w-xs bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg pointer-events-none">
                          Missing: {m.missingFields.join(", ")}
                          <div className="absolute -top-1 left-3 w-2 h-2 bg-gray-900 rotate-45" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium">Complete</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {m.pendingDues > 0 ? (
                      <Badge tone="danger" icon={<BadgeDollarSign size={11} />}>
                        Rs. {m.pendingDues.toLocaleString()}
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <VisibilityToggle memberId={m.memberId} visible={m.visible} />
                  </td>
                  <td className="px-4 py-3">
                    {m.featured && (
                      <Badge tone="warning" className="rounded-full">Featured</Badge>
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
                </PanelTableRow>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Status + infinite scroll sentinel ───────────────────────── */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-gray-400 text-center">
          Showing {Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length} members
          {currentPage < totalPages && <span className="ml-1 text-indigo-400">· scroll for more</span>}
        </div>
        <div ref={sentinelRef} className="h-1" />
      </PanelTable>
    </div>
  );
}
