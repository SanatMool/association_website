"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, Pencil, Users } from "lucide-react";
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
        <div className="relative max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, role, or venue…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
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

      {filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <SortBtn col="order" label="#" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <SortBtn col="name" label="Name" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <SortBtn col="role" label="Role" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Venue
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{m.order}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-1.5">
                      {m.name}
                      {m.highlighted && (
                        <span className="px-1.5 py-0.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full">★</span>
                      )}
                    </div>
                    {m.nameNe && (
                      <div className="text-xs text-gray-400 mt-0.5">{m.nameNe}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <div>{m.role}</div>
                    {m.roleKey && m.roleKey !== "member" && (
                      <div className="text-xs text-gray-400">{m.roleKey}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm hidden md:table-cell">{m.venue ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/committee/${m.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <Pencil size={11} />
                        Edit
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
