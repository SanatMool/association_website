"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, CheckCircle2, Circle, Clock, AlertTriangle, ChevronDown, X } from "lucide-react";

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

function formatDue(dueDate: string): string {
  const d = new Date(dueDate);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    dueDate: "",
    assignee: "",
  });

  async function fetchTasks() {
    const res = await fetch("/api/tasks");
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchTasks(); }, []);

  useEffect(() => {
    if (showForm) titleRef.current?.focus();
  }, [showForm]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status: "todo" }),
    });
    setForm({ title: "", description: "", priority: "medium", dueDate: "", assignee: "" });
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
    if (!confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
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
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20 focus:border-[#0a1040]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Assignee</label>
                <input
                  value={form.assignee}
                  onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                  placeholder="Name or email"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20 focus:border-[#0a1040]"
                />
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
                  {/* Status toggle */}
                  <button
                    onClick={() => {
                      const next: TaskStatus =
                        task.status === "todo"
                          ? "in_progress"
                          : task.status === "in_progress"
                          ? "done"
                          : "todo";
                      updateStatus(task.id, next);
                    }}
                    title={`Mark as ${task.status === "todo" ? "in progress" : task.status === "in_progress" ? "done" : "to do"}`}
                    className="flex-shrink-0"
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
                      <span className="text-xs text-gray-400 hidden sm:block">{formatDue(task.dueDate)}</span>
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
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
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
                        <span>Due: <span className={overdue ? "text-red-600 font-medium" : "text-gray-600"}>{formatDue(task.dueDate)}</span></span>
                      )}
                      {task.assignee && (
                        <span>Assigned to: <span className="text-gray-600">{task.assignee}</span></span>
                      )}
                      <span>Created: {new Date(task.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                    {/* Status change buttons */}
                    <div className="flex gap-2">
                      {STATUS_ORDER.filter((s) => s !== task.status).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(task.id, s)}
                          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                        >
                          Move to {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
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
