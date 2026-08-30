"use client";

import { useEffect, useState, useRef } from "react";
import {
  Plus, Trash2, CheckCircle2, Circle, Clock, AlertTriangle,
  ChevronDown, X, Search, ArrowUpDown, MessageSquare, ListChecks,
  ChevronRight, Send, Pencil, Activity, Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import PanelCard from "@/components/ui/panel/PanelCard";
import EmptyState from "@/components/ui/panel/EmptyState";

type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high";

interface Comment {
  id: string;
  text: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

interface Subtask {
  id: string;
  title: string;
  assignee: string | null;
  status: "todo" | "done";
  completedAt: string | null;
  comments: Comment[];
  createdAt: string;
}

interface TaskActivity {
  id: string;
  action: string;
  detail: string | null;
  actorName: string;
  createdAt: string;
}

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
  subtaskTotal: number;
  subtaskDone: number;
}

interface AdminTaskDetail extends AdminTask {
  subtasks: Subtask[];
  activities: TaskActivity[];
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; border: string; bar: string }> = {
  high:   { label: "High",   color: "text-red-700",   bg: "bg-red-50",   border: "border-l-red-400",   bar: "bg-red-400" },
  medium: { label: "Medium", color: "text-amber-700", bg: "bg-amber-50", border: "border-l-amber-400", bar: "bg-amber-400" },
  low:    { label: "Low",    color: "text-green-700", bg: "bg-green-50", border: "border-l-green-400", bar: "bg-green-400" },
};

const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "done"];

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"priority" | "dueDate" | "createdAt">("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<AdminTaskDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<"subtasks" | "activity">("subtasks");
  const titleRef = useRef<HTMLInputElement>(null);

  // New task form
  const [form, setForm] = useState({
    title: "", description: "", priority: "medium" as TaskPriority,
    dueDate: "", assignee: "", notes: "",
  });
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<string | null>(null);

  // Subtask state
  const [newSubtask, setNewSubtask] = useState("");
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [confirmDeleteSubtask, setConfirmDeleteSubtask] = useState<string | null>(null);
  const [expandedSubtaskId, setExpandedSubtaskId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [addingComment, setAddingComment] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null);

  async function fetchTasks() {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to load tasks.");
      setTasks(await res.json());
    } catch {
      setLoadError("Couldn't load tasks. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDetail(id: string) {
    setLoadingDetail(true);
    const res = await fetch(`/api/tasks/${id}`);
    if (res.ok) setExpandedDetail(await res.json());
    setLoadingDetail(false);
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
    if (expandedId === id) await fetchDetail(id);
  }

  async function deleteTask(id: string) {
    setConfirmDeleteId(null);
    if (expandedId === id) { setExpandedId(null); setExpandedDetail(null); }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedDetail(null);
    } else {
      setExpandedId(id);
      setExpandedDetail(null);
      setExpandedSubtaskId(null);
      setNewSubtask("");
      setNewSubtaskAssignee("");
      await fetchDetail(id);
    }
  }

  // Subtask actions
  async function addSubtask() {
    if (!newSubtask.trim() || !expandedId) return;
    setAddingSubtask(true);
    const res = await fetch(`/api/tasks/${expandedId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newSubtask.trim(), assignee: newSubtaskAssignee.trim() || null }),
    });
    if (res.ok) {
      setNewSubtask("");
      setNewSubtaskAssignee("");
      await fetchDetail(expandedId);
      await fetchTasks();
    }
    setAddingSubtask(false);
  }

  async function toggleSubtask(subtaskId: string, current: "todo" | "done") {
    if (!expandedId) return;
    const next = current === "done" ? "todo" : "done";
    await fetch(`/api/tasks/${expandedId}/subtasks/${subtaskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    await fetchDetail(expandedId);
    await fetchTasks();
  }

  async function deleteSubtask(subtaskId: string) {
    if (!expandedId) return;
    setConfirmDeleteSubtask(null);
    await fetch(`/api/tasks/${expandedId}/subtasks/${subtaskId}`, { method: "DELETE" });
    await fetchDetail(expandedId);
    await fetchTasks();
    if (expandedSubtaskId === subtaskId) setExpandedSubtaskId(null);
  }

  async function addComment(subtaskId: string) {
    const text = newComment[subtaskId]?.trim();
    if (!text || !expandedId) return;
    setAddingComment(subtaskId);
    await fetch(`/api/tasks/${expandedId}/subtasks/${subtaskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setNewComment((p) => ({ ...p, [subtaskId]: "" }));
    await fetchDetail(expandedId);
    setAddingComment(null);
  }

  async function saveComment(subtaskId: string, commentId: string) {
    if (!expandedId || !editCommentText.trim()) return;
    await fetch(`/api/tasks/${expandedId}/subtasks/${subtaskId}/comments/${commentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editCommentText.trim() }),
    });
    setEditingCommentId(null);
    await fetchDetail(expandedId);
  }

  async function deleteComment(subtaskId: string, commentId: string) {
    if (!expandedId) return;
    setConfirmDeleteCommentId(null);
    await fetch(`/api/tasks/${expandedId}/subtasks/${subtaskId}/comments/${commentId}`, { method: "DELETE" });
    await fetchDetail(expandedId);
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
        cmp = (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ListChecks size={22} className="text-[#0a1040]" />
            Tasks
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{counts.todo + counts.in_progress} pending · {counts.done} completed</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm rounded-xl hover:bg-[#0d1550] transition-colors min-h-[44px] w-full sm:w-auto justify-center"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "New task"}
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <PanelCard className="p-5" hover={false}>
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Plus size={14} className="text-[#0a1040]" />
                New Task
              </h2>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      placeholder="Name…"
                      list="task-assignee-list"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20 focus:border-[#0a1040]"
                    />
                    <datalist id="task-assignee-list">
                      {memberNames.map((name) => <option key={name} value={name} />)}
                    </datalist>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-[#0a1040] text-white text-sm rounded-xl hover:bg-[#0d1550] disabled:opacity-60 transition-colors"
                  >
                    {submitting ? "Creating…" : "Create task"}
                  </button>
                </div>
              </form>
            </PanelCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + sort */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="relative flex-1 min-w-44">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or assignee…"
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20 focus:border-[#0a1040]"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={12} className="text-gray-400" />
          {(["priority", "dueDate", "createdAt"] as const).map((k) => (
            <button
              key={k}
              onClick={() => { if (sortKey === k) setSortAsc((v) => !v); else { setSortKey(k); setSortAsc(k === "dueDate"); } }}
              className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${sortKey === k ? "bg-[#0a1040] text-white border-[#0a1040]" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
            >
              {k === "priority" ? "Priority" : k === "dueDate" ? "Due Date" : "Newest"}
              {sortKey === k && <span className="ml-1 opacity-60">{sortAsc ? "↑" : "↓"}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {(["all", ...STATUS_ORDER] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]}
            <span className="ml-1.5 text-xs text-gray-400">{counts[s === "all" ? "all" : s]}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading tasks…</div>
      ) : loadError ? (
        <PanelCard className="py-16 text-center" hover={false}>
          <AlertTriangle size={24} className="text-amber-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-3">{loadError}</p>
          <button
            onClick={() => void fetchTasks()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0a1040] rounded-lg hover:bg-[#0d1550] transition-colors mx-auto"
          >
            Try again
          </button>
        </PanelCard>
      ) : filtered.length === 0 ? (
        <PanelCard className="py-16" hover={false}>
          <EmptyState
            icon={CheckCircle2}
            title="No tasks here."
            action={
              <button onClick={() => setShowForm(true)} className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                Create one →
              </button>
            }
          />
        </PanelCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const overdue = isOverdue(task.dueDate) && task.status !== "done";
            const pc = PRIORITY_CONFIG[task.priority];
            const expanded = expandedId === task.id;
            const progress = task.subtaskTotal > 0 ? Math.round((task.subtaskDone / task.subtaskTotal) * 100) : null;

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border-l-4 border border-gray-100 transition-all ${pc.border} ${
                  task.status === "done" ? "opacity-55" : overdue ? "border-red-200" : "hover:border-gray-200"
                } ${expanded ? "shadow-sm" : ""}`}
              >
                {/* Card header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Status toggle */}
                  <button
                    onClick={() => {
                      if (task.status === "done") return;
                      updateStatus(task.id, task.status === "todo" ? "in_progress" : "done");
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

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0" onClick={() => toggleExpand(task.id)} role="button">
                    <span className={`text-sm font-medium ${task.status === "done" ? "line-through text-gray-400" : "text-gray-900"}`}>
                      {task.title}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {task.description && !expanded && (
                        <p className="text-xs text-gray-400 truncate max-w-xs">{task.description}</p>
                      )}
                      {task.subtaskTotal > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <ListChecks size={10} />
                          {task.subtaskDone}/{task.subtaskTotal}
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    {progress !== null && !expanded && (
                      <div className="w-full h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden max-w-xs">
                        <div
                          className={`h-full rounded-full transition-all ${pc.bar}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Badges + actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    {overdue && (
                      <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                        <AlertTriangle size={11} />
                        <span className="hidden sm:inline">Overdue</span>
                      </span>
                    )}
                    {task.dueDate && !overdue && task.status !== "done" && (
                      <span className="text-xs text-gray-400 hidden sm:block">{formatDate(task.dueDate)}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${pc.bg} ${pc.color}`}>
                      {pc.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      task.status === "done" ? "bg-green-50 text-green-700"
                        : task.status === "in_progress" ? "bg-blue-50 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                    {task.assignee && (
                      <span className="text-xs text-gray-400 hidden md:block">{task.assignee}</span>
                    )}
                    <button
                      onClick={() => toggleExpand(task.id)}
                      className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                    >
                      <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>
                    {confirmDeleteId === task.id ? (
                      <span className="flex items-center gap-1">
                        <button onClick={() => deleteTask(task.id)} className="text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded-lg hover:bg-red-600">Delete</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
                      </span>
                    ) : (
                      <button
                        onClick={() => { setConfirmDeleteId(task.id); }}
                        className="text-gray-300 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded body */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-gray-50">
                        {/* Description + meta */}
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-3">
                          {task.dueDate && (
                            <span>Due: <span className={overdue ? "text-red-600 font-medium" : "text-gray-600"}>{formatDate(task.dueDate)}</span></span>
                          )}
                          {task.assignee && <span>Assigned: <span className="text-gray-600">{task.assignee}</span></span>}
                          <span>Created: {formatDate(task.createdAt)}</span>
                          {task.completedAt && (
                            <span>Completed: <span className="text-green-600">{formatDate(task.completedAt)}</span></span>
                          )}
                        </div>

                        {/* Follow-up notes */}
                        <div className="mb-4">
                          <label className="text-xs font-medium text-gray-500 block mb-1">Follow-up notes</label>
                          <textarea
                            value={editNotes[task.id] ?? task.notes ?? ""}
                            onChange={(e) => setEditNotes((n) => ({ ...n, [task.id]: e.target.value }))}
                            placeholder="Add progress notes, follow-ups, blockers…"
                            rows={2}
                            disabled={task.status === "done"}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0a1040]/30 resize-none disabled:bg-gray-50 disabled:text-gray-400"
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

                        {/* Sub-tabs: Subtasks | Activity */}
                        <div className="flex gap-1 mb-3 bg-gray-100 p-1 rounded-xl w-fit">
                          {(["subtasks", "activity"] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActiveDetailTab(tab)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                activeDetailTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              {tab === "subtasks" ? <ListChecks size={11} /> : <Activity size={11} />}
                              {tab === "subtasks" ? "Subtasks" : "Activity"}
                              {tab === "subtasks" && task.subtaskTotal > 0 && (
                                <span className="ml-0.5 text-gray-400">{task.subtaskDone}/{task.subtaskTotal}</span>
                              )}
                            </button>
                          ))}
                        </div>

                        {loadingDetail ? (
                          <div className="text-xs text-gray-400 py-4 text-center">Loading…</div>
                        ) : expandedDetail && expandedDetail.id === task.id ? (
                          <>
                            {/* Subtasks tab */}
                            {activeDetailTab === "subtasks" && (
                              <div className="space-y-1.5">
                                {expandedDetail.subtasks.length === 0 && (
                                  <p className="text-xs text-gray-400 py-2">No subtasks yet. Add one below.</p>
                                )}
                                {expandedDetail.subtasks.map((sub) => (
                                  <div key={sub.id} className="bg-gray-50 rounded-xl overflow-hidden">
                                    {/* Subtask row */}
                                    <div className="flex items-center gap-2 px-3 py-2">
                                      <button
                                        onClick={() => toggleSubtask(sub.id, sub.status)}
                                        className="flex-shrink-0"
                                        disabled={task.status === "done"}
                                      >
                                        {sub.status === "done"
                                          ? <CheckCircle2 size={15} className="text-green-500" />
                                          : <Circle size={15} className="text-gray-300 hover:text-gray-400" />
                                        }
                                      </button>
                                      <span className={`flex-1 text-xs ${sub.status === "done" ? "line-through text-gray-400" : "text-gray-700"}`}>
                                        {sub.title}
                                      </span>
                                      {sub.assignee && (
                                        <span className="text-xs text-gray-400 hidden sm:block">{sub.assignee}</span>
                                      )}
                                      {/* Comment toggle */}
                                      <button
                                        onClick={() => setExpandedSubtaskId(expandedSubtaskId === sub.id ? null : sub.id)}
                                        className={`flex items-center gap-1 text-xs transition-colors ${
                                          expandedSubtaskId === sub.id ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
                                        }`}
                                      >
                                        <MessageSquare size={12} />
                                        {sub.comments.length > 0 && <span>{sub.comments.length}</span>}
                                      </button>
                                      {confirmDeleteSubtask === sub.id ? (
                                        <span className="flex items-center gap-1">
                                          <button onClick={() => deleteSubtask(sub.id)} className="text-xs text-white bg-red-500 px-1.5 py-0.5 rounded hover:bg-red-600">Del</button>
                                          <button onClick={() => setConfirmDeleteSubtask(null)} className="text-gray-400"><X size={11} /></button>
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => setConfirmDeleteSubtask(sub.id)}
                                          className="text-gray-300 hover:text-red-400 transition-colors"
                                          disabled={task.status === "done"}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>

                                    {/* Comment thread */}
                                    <AnimatePresence>
                                      {expandedSubtaskId === sub.id && (
                                        <motion.div
                                          initial={{ height: 0 }}
                                          animate={{ height: "auto" }}
                                          exit={{ height: 0 }}
                                          className="overflow-hidden border-t border-gray-100"
                                        >
                                          <div className="px-3 py-2 space-y-2">
                                            {sub.comments.length === 0 && (
                                              <p className="text-xs text-gray-400">No comments yet.</p>
                                            )}
                                            {sub.comments.map((c) => (
                                              <div key={c.id} className="text-xs">
                                                {editingCommentId === c.id ? (
                                                  <div className="flex gap-2">
                                                    <input
                                                      value={editCommentText}
                                                      onChange={(e) => setEditCommentText(e.target.value)}
                                                      className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0a1040]/20"
                                                      onKeyDown={(e) => { if (e.key === "Enter") saveComment(sub.id, c.id); if (e.key === "Escape") setEditingCommentId(null); }}
                                                    />
                                                    <button onClick={() => saveComment(sub.id, c.id)} className="text-green-600 hover:text-green-700"><Check size={12} /></button>
                                                    <button onClick={() => setEditingCommentId(null)} className="text-gray-400"><X size={12} /></button>
                                                  </div>
                                                ) : (
                                                  <div className="flex items-start gap-2 group">
                                                    <div className="flex-1">
                                                      <span className="font-medium text-gray-600">{c.authorName}</span>
                                                      <span className="text-gray-400 ml-1">{timeAgo(c.createdAt)}</span>
                                                      <p className="text-gray-700 mt-0.5">{c.text}</p>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                      <button
                                                        onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.text); }}
                                                        className="text-gray-400 hover:text-gray-600"
                                                      >
                                                        <Pencil size={11} />
                                                      </button>
                                                      {confirmDeleteCommentId === c.id ? (
                                                        <>
                                                          <button onClick={() => deleteComment(sub.id, c.id)} className="text-red-500 hover:text-red-600 font-semibold text-[10px]">Del</button>
                                                          <button onClick={() => setConfirmDeleteCommentId(null)} className="text-gray-400"><X size={11} /></button>
                                                        </>
                                                      ) : (
                                                        <button onClick={() => setConfirmDeleteCommentId(c.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={11} /></button>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                            {/* Add comment */}
                                            <div className="flex gap-2 pt-1">
                                              <input
                                                value={newComment[sub.id] ?? ""}
                                                onChange={(e) => setNewComment((p) => ({ ...p, [sub.id]: e.target.value }))}
                                                placeholder="Add a comment…"
                                                onKeyDown={(e) => { if (e.key === "Enter") addComment(sub.id); }}
                                                className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0a1040]/20"
                                              />
                                              <button
                                                onClick={() => addComment(sub.id)}
                                                disabled={addingComment === sub.id || !newComment[sub.id]?.trim()}
                                                className="px-2 py-1.5 bg-[#0a1040] text-white rounded-lg disabled:opacity-50 hover:bg-[#0d1550] transition-colors"
                                              >
                                                <Send size={11} />
                                              </button>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ))}

                                {/* Add subtask row */}
                                {task.status !== "done" && (
                                  <div className="flex gap-2 pt-1">
                                    <input
                                      value={newSubtask}
                                      onChange={(e) => setNewSubtask(e.target.value)}
                                      placeholder="Add a subtask…"
                                      onKeyDown={(e) => { if (e.key === "Enter") addSubtask(); }}
                                      className="flex-1 px-3 py-2 border border-dashed border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0a1040]/20 focus:border-[#0a1040] bg-gray-50"
                                    />
                                    <input
                                      value={newSubtaskAssignee}
                                      onChange={(e) => setNewSubtaskAssignee(e.target.value)}
                                      placeholder="Assignee (opt.)"
                                      list="subtask-assignee-list"
                                      className="w-32 px-2 py-2 border border-dashed border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0a1040]/20 bg-gray-50"
                                    />
                                    <datalist id="subtask-assignee-list">
                                      {memberNames.map((n) => <option key={n} value={n} />)}
                                    </datalist>
                                    <button
                                      onClick={addSubtask}
                                      disabled={addingSubtask || !newSubtask.trim()}
                                      className="px-3 py-2 bg-[#0a1040] text-white rounded-xl text-xs disabled:opacity-50 hover:bg-[#0d1550] transition-colors flex items-center gap-1"
                                    >
                                      <Plus size={12} />
                                      {addingSubtask ? "…" : "Add"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Activity tab */}
                            {activeDetailTab === "activity" && (
                              <div className="space-y-2">
                                {expandedDetail.activities.length === 0 ? (
                                  <p className="text-xs text-gray-400 py-2">No activity recorded yet.</p>
                                ) : (
                                  expandedDetail.activities.map((a) => (
                                    <div key={a.id} className="flex items-start gap-2 text-xs">
                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <span className="text-gray-700">{a.detail ?? a.action}</span>
                                        <span className="text-gray-400 ml-2">{timeAgo(a.createdAt)}</span>
                                      </div>
                                      <span className="text-gray-400 text-[10px]">{a.actorName}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </>
                        ) : null}

                        {/* Status change buttons */}
                        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-50">
                          {task.status !== "done" && (
                            STATUS_ORDER.filter((s) => s !== task.status && s !== "todo").map((s) => (
                              <button
                                key={s}
                                onClick={() => updateStatus(task.id, s)}
                                className="text-xs px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors flex items-center gap-1"
                              >
                                <ChevronRight size={11} />
                                Move to {STATUS_LABELS[s]}
                              </button>
                            ))
                          )}
                          {task.status === "done" && (
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 size={11} />
                              Completed{task.completedAt ? ` on ${formatDate(task.completedAt)}` : ""} — locked
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
