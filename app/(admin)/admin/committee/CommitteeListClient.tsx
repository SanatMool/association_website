"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, Pencil, Users, Star, Building2, X } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";

export interface CommitteeRow {
  id: string;
  name: string;
  nameNe: string | null;
  role: string;
  roleKey: string | null;
  venue: string | null;
  highlighted: boolean;
  order: number;
}

type SortKey = "order" | "name" | "role";

export default function CommitteeListClient({ members }: { members: CommitteeRow[] }) {
  const [search,  setSearch]  = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [sortAsc, setSortAsc] = useState(true);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  const filtered = members
    .filter((m) => {
      const q = search.toLowerCase();
      return (
        q === "" ||
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        (m.venue ?? "").toLowerCase().includes(q) ||
        (m.nameNe ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "order") cmp = a.order - b.order;
      if (sortKey === "name")  cmp = a.name.localeCompare(b.name);
      if (sortKey === "role")  cmp = a.role.localeCompare(b.role);
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
      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, role, or venue…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {members.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 text-center py-16 text-gray-400">
          <Users size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No committee members yet.</p>
        </div>
      )}

      {filtered.length === 0 && members.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 text-center py-10 text-gray-400 text-sm">
          No members match your search.
        </div>
      )}

      {/* ── Mobile cards ── */}
      {filtered.length > 0 && (
        <div className="md:hidden bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {filtered.map((m) => (
            <div key={m.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-gray-400 font-mono">#{m.order}</span>
                    <span className="font-semibold text-gray-900 text-sm">{m.name}</span>
                    {m.highlighted && <Star size={11} className="text-amber-500 flex-shrink-0" fill="currentColor" />}
                  </div>
                  {m.nameNe && <p className="text-xs text-gray-400 mt-0.5">{m.nameNe}</p>}
                  <p className="text-sm text-gray-600 mt-1">{m.role}</p>
                  {m.venue && (
                    <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <Building2 size={10} /> {m.venue}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Link href={`/admin/committee/${m.id}`}
                    className="flex items-center gap-1 px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 min-h-[36px]">
                    <Pencil size={11} /> Edit
                  </Link>
                  <DeleteButton id={m.id} entity="committee" redirectTo="/admin/committee" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Desktop table ── */}
      {filtered.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-10">
                  <SortBtn col="order" label="#" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <SortBtn col="name" label="Name" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <SortBtn col="role" label="Role" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <Building2 size={11} className="inline mr-1" />Venue
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">{m.order}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-1.5">
                      {m.name}
                      {m.highlighted && <Star size={11} className="text-amber-500 flex-shrink-0" fill="currentColor" />}
                    </div>
                    {m.nameNe && <div className="text-xs text-gray-400 mt-0.5">{m.nameNe}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.role}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{m.venue ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/admin/committee/${m.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                        <Pencil size={11} /> Edit
                      </Link>
                      <DeleteButton id={m.id} entity="committee" redirectTo="/admin/committee" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
