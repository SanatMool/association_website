"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, CheckCircle2, Circle, Clock, AlertTriangle, ChevronDown, X, Search, ArrowUpDown } from "lucide-react";
import { formatDate } from "@/lib/utils";

type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high";

interface AdminTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignee: string | null;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  high: { label: "High", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  medium: { label: "Medium", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  low: { label: "Low", color: "text-green-700", bg: "bg-green-50 border-green-200" },
};

const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "done"];

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"priority" | "dueDate" | "createdAt">("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    dueDate: "",
    assignee: "",
    notes: "",
  });
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<string | null>(null);

  async function fetchTasks() {
    const res = await fetch("/api/tasks");
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchTasks();
    fetch("/api/members?limit=500")
      .then((r) => r.json())
      .then((json: { success?: boolean; data?: { name: string }[] } | { name: string }[]) => {
        const list = Array.isArray(json) ? json : (json as { data?: { name: string }[] }).data ?? [];
        setMemberNames(list.map((m: { name: string }) => m.name).filter(Boolean));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (showForm) titleRef.current?.focus();
  }, [showForm]);

  async function saveNotes(task: AdminTask) {
    const notes = editNotes[task.id] ?? task.notes ?? "";
    setSavingNotes(task.id);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    await fetchTasks();
    setSavingNotes(null);
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status: "todo" }),
    });
    setForm({ title: "", description: "", priority: "medium", dueDate: "", assignee: "", notes: "" });
    setShowForm(false);
    await fetchTasks();
    setSubmitting(false);
  }

  async function updateStatus(id: string, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchTasks();
  }

  async function deleteTask(id: string) {
    setConfirmDeleteId(null);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }

  const PRIORITY_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

  const filtered = tasks
    .filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.assignee ?? "").toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "priority") cmp = (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0);
      else if (sortKey === "dueDate") {
        const ad = a.dueDate ?? "9999-99-99";
        const bd = b.dueDate ?? "9999-99-99";
        cmp = ad.localeCompare(bd);
      } else {
        cmp = a.createdAt.localeCompare(b.createdAt);
      }
      return sortAsc ? cmp : -cmp;
    });

  const counts = { all: tasks.length, todo: 0, in_progress: 0, done: 0 };
  tasks.forEach((t) => counts[t.status]++);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">{counts.todo + counts.in_progress} pending</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] transition-colors"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "New task"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">New Task</h2>
          <form onSubmit={createTask} className="space-y-3">
            <input
              ref={titleRef}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Task title *"
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20 focus:border-[#0a1040]"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20 focus:border-[#0a1040] resize-none"
            />
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Follow-up notes (optional)"
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20 focus:border-[#0a1040] resize-none"
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20 focus:border-[#0a1040] bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Due date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20 focus:border-[#0a1040]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Assignee</label>
                <input
                  value={form.assignee}
                  onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                  placeholder="Type or pick a member…"
                  list="task-assignee-list"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20 focus:border-[#0a1040]"
                />
                <datalist id="task-assignee-list">
                  {memberNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] disabled:opacity-60 transition-colors"
              >
                {submitting ? "Creating…" : "Create task"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search + sort */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="relative flex-1 min-w-44">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or assignee…"
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20 focus:border-[#0a1040]"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={12} className="text-gray-400" />
          {(["priority", "dueDate", "createdAt"] as const).map((k) => (
            <button
              key={k}
              onClick={() => { if (sortKey === k) setSortAsc((v) => !v); else { setSortKey(k); setSortAsc(k === "dueDate"); } }}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${sortKey === k ? "bg-[#0a1040] text-white border-[#0a1040]" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
            >
              {k === "priority" ? "Priority" : k === "dueDate" ? "Due Date" : "Newest"}
              {sortKey === k && <span className="ml-1 opacity-60">{sortAsc ? "↑" : "↓"}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {(["all", ...STATUS_ORDER] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === s
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]}
            <span className={`ml-1.5 text-xs ${filter === s ? "text-gray-400" : "text-gray-400"}`}>
              {counts[s === "all" ? "all" : s]}
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading tasks…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="text-3xl mb-3">✓</div>
          <p className="text-gray-500 text-sm">No tasks here.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Create one →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const overdue = isOverdue(task.dueDate) && task.status !== "done";
            const pc = PRIORITY_CONFIG[task.priority];
            const expanded = expandedId === task.id;

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border transition-all ${
                  task.status === "done"
                    ? "border-gray-100 opacity-60"
                    : overdue
                    ? "border-red-200"
                    : "border-gray-100 hover:border-gray-200"
                } ${expanded ? "shadow-sm" : ""}`}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Status toggle — done tasks are locked */}
                  <button
                    onClick={() => {
                      if (task.status === "done") return;
                      const next: TaskStatus = task.status === "todo" ? "in_progress" : "done";
                      updateStatus(task.id, next);
                    }}
                    title={task.status === "done" ? "Completed" : task.status === "todo" ? "Mark as in progress" : "Mark as done"}
                    className={`flex-shrink-0 ${task.status === "done" ? "cursor-default" : "cursor-pointer"}`}
                  >
                    {task.status === "done" ? (
                      <CheckCircle2 size={18} className="text-green-500" />
                    ) : task.status === "in_progress" ? (
                      <Clock size={18} className="text-blue-500" />
                    ) : (
                      <Circle size={18} className="text-gray-300 hover:text-gray-400" />
                    )}
                  </button>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm font-medium ${
                        task.status === "done" ? "line-through text-gray-400" : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.description && !expanded && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{task.description}</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {overdue && (
                      <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                        <AlertTriangle size={11} />
                        Overdue
                      </span>
                    )}
                    {task.dueDate && !overdue && task.status !== "done" && (
                      <span className="text-xs text-gray-400 hidden sm:block">{formatDate(task.dueDate)}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${pc.bg} ${pc.color}`}>
                      {pc.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      task.status === "done"
                        ? "bg-green-50 text-green-700"
                        : task.status === "in_progress"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                    {task.assignee && (
                      <span className="text-xs text-gray-400 hidden md:block">{task.assignee}</span>
                    )}
                    <button
                      onClick={() => setExpandedId(expanded ? null : task.id)}
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>
                    {confirmDeleteId === task.id ? (
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => { setConfirmDeleteId(task.id); setExpandedId(null); }}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-50 space-y-3">
                    {task.description && (
                      <p className="text-sm text-gray-600">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                      {task.dueDate && (
                        <span>Due: <span className={overdue ? "text-red-600 font-medium" : "text-gray-600"}>{formatDate(task.dueDate)}</span></span>
                      )}
                      {task.assignee && (
                        <span>Assigned to: <span className="text-gray-600">{task.assignee}</span></span>
                      )}
                      <span>Created: {formatDate(task.createdAt)}</span>
                      {task.completedAt && (
                        <span>Completed: <span className="text-green-600">{formatDate(task.completedAt)}</span></span>
                      )}
                    </div>
                    {/* Follow-up notes */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Follow-up notes</label>
                      <textarea
                        value={editNotes[task.id] ?? task.notes ?? ""}
                        onChange={(e) => setEditNotes((n) => ({ ...n, [task.id]: e.target.value }))}
                        placeholder="Add progress notes, follow-ups, blockers…"
                        rows={2}
                        disabled={task.status === "done"}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0a1040]/30 resize-none disabled:bg-gray-50 disabled:text-gray-400"
                      />
                      {task.status !== "done" && (editNotes[task.id] ?? task.notes ?? "") !== (task.notes ?? "") && (
                        <button
                          onClick={() => saveNotes(task)}
                          disabled={savingNotes === task.id}
                          className="mt-1 text-xs text-[#0a1040] hover:underline disabled:opacity-50"
                        >
                          {savingNotes === task.id ? "Saving…" : "Save notes"}
                        </button>
                      )}
                    </div>
                    {/* Status change buttons — locked once done */}
                    {task.status !== "done" && (
                      <div className="flex gap-2">
                        {STATUS_ORDER.filter((s) => s !== task.status && s !== "todo").map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(task.id, s)}
                            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                          >
                            Move to {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    )}
                    {task.status === "done" && (
                      <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 size={11} /> Completed{task.completedAt ? ` on ${formatDate(task.completedAt)}` : ""} — this task is locked.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
