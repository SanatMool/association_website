"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound, Trash2, RefreshCw, Check, X, Eye, EyeOff,
  Users2, ShieldCheck, Info, Search, ChevronRight, ChevronLeft,
  Loader2, Mail, Lock, UserCheck, AlertCircle, Plus, List, Wand2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import PanelCard from "@/components/ui/panel/PanelCard";
import Badge from "@/components/ui/panel/Badge";
import EmptyState from "@/components/ui/panel/EmptyState";
import ConfirmDialog from "@/components/ui/panel/ConfirmDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortalAccount {
  id: string;
  email: string;
  createdAt: string;
  emailFailedAt: string | null;
  emailError: string | null;
}
interface MemberRow {
  memberId: string;
  memberName: string;
  area: string;
  account: PortalAccount | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Select Member",   icon: Users2,      hint: "Choose which member gets portal access" },
  { id: 2, label: "Set Credentials", icon: KeyRound,    hint: "Email address and initial password" },
  { id: 3, label: "Review & Create", icon: ShieldCheck, hint: "Confirm everything before creating" },
];

const stepVariants = {
  enter:  (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function passwordStrength(pwd: string): { label: string; color: string; bars: number } {
  if (pwd.length === 0) return { label: "", color: "", bars: 0 };
  if (pwd.length < 8)   return { label: "Too short", color: "bg-red-400", bars: 1 };
  const hasUpper  = /[A-Z]/.test(pwd);
  const hasLower  = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
  const score = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  if (score <= 2) return { label: "Weak",   color: "bg-orange-400", bars: 2 };
  if (score === 3) return { label: "Good",   color: "bg-blue-500",   bars: 3 };
  return              { label: "Strong", color: "bg-emerald-500", bars: 4 };
}

function generateStrongPassword(): string {
  const upper  = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower  = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const syms   = "!@#$%&";
  const all    = upper + lower + digits + syms;
  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    syms[Math.floor(Math.random() * syms.length)],
  ];
  for (let i = required.length; i < 12; i++) {
    required.push(all[Math.floor(Math.random() * all.length)]);
  }
  return required.sort(() => Math.random() - 0.5).join("");
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PortalAccountsPage() {
  const [rows,       setRows]      = useState<MemberRow[]>([]);
  const [loading,    setLoading]   = useState(true);
  const [activeTab,  setActiveTab] = useState<"create" | "list">("list");
  const [tableSearch, setTableSearch] = useState("");
  const [tablePage,  setTablePage] = useState(1);

  // Create form state
  const [step,    setStep]    = useState(1);
  const [dir,     setDir]     = useState(1);
  const [createId,    setCreateId]    = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPwd,   setCreatePwd]   = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [createErr,   setCreateErr]   = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  // Reset password state
  const [resetId,   setResetId]   = useState<string | null>(null);
  const [resetPwd,  setResetPwd]  = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetErr,  setResetErr]  = useState("");

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState("");
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  async function load() {
    const res  = await fetch("/api/admin/portal-accounts");
    const json = await res.json() as { success: boolean; data: MemberRow[] };
    if (json.success) setRows(json.data);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const membersWithoutAccount = rows.filter((r) => !r.account);
  const filteredForSelect = memberSearch.trim()
    ? membersWithoutAccount.filter((r) =>
        r.memberName.toLowerCase().includes(memberSearch.toLowerCase()) ||
        r.area.toLowerCase().includes(memberSearch.toLowerCase()))
    : membersWithoutAccount;

  const selectedMember = rows.find((r) => r.memberId === createId);
  const pwdStrength    = passwordStrength(createPwd);
  const pwdMatch       = confirmPwd === createPwd;

  const PAGE_SIZE = 20;
  const filteredRows = tableSearch.trim()
    ? rows.filter((r) =>
        r.memberName.toLowerCase().includes(tableSearch.toLowerCase()) ||
        r.area.toLowerCase().includes(tableSearch.toLowerCase()) ||
        (r.account?.email ?? "").toLowerCase().includes(tableSearch.toLowerCase()))
    : rows;
  const totalPages   = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = filteredRows.slice((tablePage - 1) * PAGE_SIZE, tablePage * PAGE_SIZE);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validateStep(s: number): string {
    if (s === 1 && !createId) return "Please select a member to create an account for.";
    if (s === 2 && !createEmail) return "Login email is required.";
    if (s === 2 && !isValidEmail(createEmail)) return "Please enter a valid email address.";
    if (s === 2 && !createPwd) return "Password is required.";
    if (s === 2 && createPwd.length < 8) return "Password must be at least 8 characters.";
    if (s === 2 && !pwdMatch) return "Passwords do not match.";
    return "";
  }

  function goNext() {
    const err = validateStep(step);
    if (err) { setCreateErr(err); return; }
    setCreateErr(""); setDir(1); setStep((s) => Math.min(3, s + 1));
  }
  function goBack() { setCreateErr(""); setDir(-1); setStep((s) => Math.max(1, s - 1)); }

  function resetCreateForm() {
    setStep(1); setDir(1);
    setCreateId(""); setCreateEmail(""); setCreatePwd(""); setConfirmPwd("");
    setShowPwd(false); setShowConfirm(false); setCreateErr(""); setMemberSearch("");
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleCreate() {
    const err = validateStep(step);
    if (err) { setCreateErr(err); return; }
    setCreating(true); setCreateErr("");
    const res  = await fetch("/api/admin/portal-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: createId, email: createEmail, password: createPwd }),
    });
    const json = await res.json() as { success: boolean; error?: string };
    if (json.success) {
      resetCreateForm();
      await load();
      setActiveTab("list");
      showToast("Portal account created successfully.");
    } else {
      setCreateErr(json.error ?? "Failed to create account. The email may already be in use.");
    }
    setCreating(false);
  }

  async function handleReset(accountId: string) {
    if (!resetPwd) return;
    if (resetPwd.length < 8) { setResetErr("Password must be at least 8 characters."); return; }
    setResetting(true); setResetErr("");
    try {
      const res  = await fetch(`/api/admin/portal-accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPwd }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) {
        setResetErr(json.error ?? "Failed to reset password. Please try again.");
        setResetting(false);
        return;
      }
      setResetId(null); setResetPwd(""); setShowReset(false);
      showToast("Password reset successfully.");
    } catch {
      setResetErr("Network error. Please try again.");
    }
    setResetting(false);
  }

  async function handleDelete(accountId: string) {
    setDeleting(true);
    const res  = await fetch(`/api/admin/portal-accounts/${accountId}`, { method: "DELETE" });
    const json = await res.json() as { success: boolean };
    setDeleteId(null); setDeleting(false);
    if (json.success) {
      await load();
      showToast("Portal access removed.");
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition";

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400 text-sm gap-2">
      <Loader2 size={18} className="animate-spin" /> Loading portal accounts…
    </div>
  );

  return (
    <div className="max-w-4xl">
      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-lg"
          >
            <Check size={15} strokeWidth={2.5} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <KeyRound size={22} className="text-amber-500" /> Portal Accounts
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Create and manage member login accounts for the Member Portal.</p>
        </div>
        <div className="flex gap-3">
          <PanelCard className="flex-1 sm:flex-none px-4 py-3 text-center" hover={false}>
            <div className="text-lg font-bold text-emerald-600">{rows.filter((r) => r.account).length}</div>
            <div className="text-xs text-gray-400 mt-0.5">With access</div>
          </PanelCard>
          <PanelCard className="flex-1 sm:flex-none px-4 py-3 text-center" hover={false}>
            <div className="text-lg font-bold text-gray-500">{rows.filter((r) => !r.account).length}</div>
            <div className="text-xs text-gray-400 mt-0.5">No access</div>
          </PanelCard>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "list"
              ? "border-[#0a1040] text-[#0a1040]"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          <List size={14} /> All Accounts
          <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${activeTab === "list" ? "bg-[#0a1040]/10 text-[#0a1040]" : "bg-gray-100 text-gray-400"}`}>
            {rows.filter((r) => r.account).length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "create"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          <Plus size={14} /> Create Account
        </button>
      </div>

      {/* ── Create flow ─────────────────────────────────────────────────────── */}
      {activeTab === "create" && (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">

        {/* Progress stepper */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const done = step > s.id; const cur = step === s.id; const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      animate={{ backgroundColor: done ? "#10b981" : cur ? "#f59e0b" : "#e5e7eb", scale: cur ? 1.15 : 1 }}
                      transition={{ duration: 0.25 }}
                      className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm">
                      {done
                        ? <Check size={16} className="text-white" strokeWidth={2.5} />
                        : <Icon size={16} className={cur ? "text-white" : "text-gray-400"} />}
                    </motion.div>
                    <span className={`text-[10px] font-medium hidden sm:block ${cur ? "text-amber-600" : done ? "text-emerald-600" : "text-gray-400"}`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 mx-2 h-0.5 rounded-full overflow-hidden bg-gray-200 mb-4">
                      <motion.div animate={{ width: step > s.id ? "100%" : "0%" }} transition={{ duration: 0.4 }}
                        className="h-full bg-emerald-400 rounded-full" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 text-center">Step {step} of {STEPS.length} — {STEPS[step - 1].hint}</p>
        </div>

        {/* Step header */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
          {(() => { const Icon = STEPS[step - 1].icon; return <div className="p-2 bg-amber-50 rounded-xl"><Icon size={18} className="text-amber-600" /></div>; })()}
          <div>
            <h2 className="font-bold text-gray-900">{STEPS[step - 1].label}</h2>
            <p className="text-xs text-gray-400">{STEPS[step - 1].hint}</p>
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={stepVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="px-6 py-6 space-y-5">

            {/* ── STEP 1: Select Member ────────────────────────────────────── */}
            {step === 1 && (<>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Only members <strong>without</strong> a portal account are shown below. Once created, the member can log in to the Member Portal using the credentials you set.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Search Members</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Type name or area to filter…"
                    className={`${inputCls} pl-9`}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {membersWithoutAccount.length} member{membersWithoutAccount.length !== 1 ? "s" : ""} available for portal access.
                </p>
              </div>

              {filteredForSelect.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm border border-gray-100 rounded-xl bg-gray-50">
                  <UserCheck size={24} className="mx-auto mb-2 opacity-30" />
                  <p>{memberSearch ? "No members match your search." : "All members already have portal accounts."}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredForSelect.map((r) => (
                    <button key={r.memberId} type="button"
                      onClick={() => setCreateId(r.memberId)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        createId === r.memberId
                          ? "bg-amber-50 border-amber-400 shadow-sm"
                          : "bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50/30"
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${createId === r.memberId ? "text-amber-900" : "text-gray-800"}`}>{r.memberName}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{r.area}</p>
                        </div>
                        {createId === r.memberId && (
                          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                            <Check size={11} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedMember && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 flex-shrink-0" />
                  <p className="text-xs text-emerald-700">
                    Selected: <strong>{selectedMember.memberName}</strong> ({selectedMember.area})
                  </p>
                </div>
              )}
            </>)}

            {/* ── STEP 2: Set Credentials ──────────────────────────────────── */}
            {step === 2 && (<>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Set the login email and a temporary password for <strong>{selectedMember?.memberName}</strong>.
                  Share these credentials with the member so they can log in and change their password.
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <span className="flex items-center gap-1.5"><Mail size={13} className="text-gray-500" /> Login Email *</span>
                </label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="member@example.com"
                  className={`${inputCls} ${createEmail && !isValidEmail(createEmail) ? "border-red-300 bg-red-50 focus:ring-red-400" : ""}`}
                />
                {createEmail && !isValidEmail(createEmail) && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> Please enter a valid email address.</p>
                )}
                {createEmail && isValidEmail(createEmail) && (
                  <p className="text-[11px] text-emerald-600 mt-1">✓ Valid email address</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">This will be the member&apos;s username for portal login.</p>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-semibold text-gray-700">
                    <span className="flex items-center gap-1.5"><Lock size={13} className="text-gray-500" /> Initial Password *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { const p = generateStrongPassword(); setCreatePwd(p); setConfirmPwd(p); setShowPwd(true); }}
                    className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
                  >
                    <Wand2 size={11} /> Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={createPwd}
                    onChange={(e) => setCreatePwd(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className={`${inputCls} pr-10 ${createPwd && createPwd.length < 8 ? "border-red-300 bg-red-50 focus:ring-red-400" : ""}`}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {/* Strength bars */}
                {createPwd.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= pwdStrength.bars ? pwdStrength.color : "bg-gray-200"}`} />
                      ))}
                    </div>
                    {pwdStrength.label && (
                      <p className={`text-[11px] font-medium ${
                        pwdStrength.bars === 1 ? "text-red-500" :
                        pwdStrength.bars === 2 ? "text-orange-500" :
                        pwdStrength.bars === 3 ? "text-blue-500" : "text-emerald-600"
                      }`}>Password strength: {pwdStrength.label}</p>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-1">Use uppercase, numbers, and symbols for a stronger password.</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <span className="flex items-center gap-1.5"><Lock size={13} className="text-gray-500" /> Confirm Password *</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Re-enter the password"
                    className={`${inputCls} pr-10 ${confirmPwd && !pwdMatch ? "border-red-300 bg-red-50 focus:ring-red-400" : confirmPwd && pwdMatch ? "border-emerald-300 bg-emerald-50/30" : ""}`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {confirmPwd && !pwdMatch && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> Passwords do not match.</p>
                )}
                {confirmPwd && pwdMatch && createPwd.length >= 8 && (
                  <p className="text-[11px] text-emerald-600 mt-1">✓ Passwords match</p>
                )}
              </div>
            </>)}

            {/* ── STEP 3: Review & Create ──────────────────────────────────── */}
            {step === 3 && (<>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex gap-2">
                <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700">
                  Please review the details below. Once created, share these credentials with the member securely.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Review Before Creating</p>
                {([
                  ["Member",        selectedMember?.memberName ?? "—"],
                  ["Area",          selectedMember?.area ?? "—"],
                  ["Login Email",   createEmail],
                  ["Password",      "•".repeat(Math.min(createPwd.length, 12)) + (createPwd.length > 12 ? "…" : "")],
                  ["Strength",      pwdStrength.label || "—"],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400 text-xs">{label}</span>
                    <span className={`font-medium text-right max-w-[60%] truncate text-xs ${
                      label === "Strength"
                        ? pwdStrength.bars >= 3 ? "text-emerald-600" : pwdStrength.bars === 2 ? "text-orange-500" : "text-red-500"
                        : "text-gray-700"
                    }`}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  After creating the account, the member can log in at <strong>/portal/login</strong> using the email and password above.
                </p>
              </div>
            </>)}

          </motion.div>
        </AnimatePresence>

        {/* Error banner */}
        {createErr && (
          <div className="mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex gap-2">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {createErr}
          </div>
        )}

        {/* Footer nav */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button type="button" onClick={goBack} disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft size={15} /> Back
          </button>
          <span className="text-xs text-gray-400">{step}/{STEPS.length}</span>
          {step < 3 ? (
            <button type="button" onClick={goNext}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#0a1040] text-white text-sm font-medium rounded-lg hover:bg-[#0d1550] shadow-sm transition-colors">
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button type="button" onClick={handleCreate} disabled={creating}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors">
              {creating
                ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
                : <><ShieldCheck size={15} /> Create Account</>}
            </button>
          )}
        </div>
      </div>
      )}

      {/* ── Members list ────────────────────────────────────────────────────── */}
      {activeTab === "list" && (
      <div>
        {/* Search bar */}
        <div className="relative mb-4">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={tableSearch}
            onChange={(e) => { setTableSearch(e.target.value); setTablePage(1); }}
            placeholder="Search name, area or email…"
            autoComplete="off"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {filteredRows.length === 0 ? (
          <PanelCard hover={false}>
            <EmptyState icon={KeyRound} title={tableSearch ? "No members match your search." : "No members found."} />
          </PanelCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedRows.map((r) => {
              const initials = r.memberName.split(" ").map((w: string) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
              const hasAccount = !!r.account;
              return (
                <motion.div key={r.memberId} layout className={hasAccount ? "" : "opacity-70"}>
                  <PanelCard className="overflow-hidden">
                  <div className="p-4">
                    {/* Avatar + name + status */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        hasAccount ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
                      }`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 leading-snug truncate">{r.memberName}</p>
                        <p className="text-xs text-gray-400 truncate">{r.area}</p>
                      </div>
                      {hasAccount
                        ? <Badge tone="success" icon={<Check size={9} />} className="flex-shrink-0">Active</Badge>
                        : <Badge tone="neutral" icon={<X size={9} />} className="flex-shrink-0">No access</Badge>
                      }
                    </div>

                    {hasAccount && (
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Mail size={10} className="flex-shrink-0 text-gray-300" />
                          <span className="truncate">{r.account!.email}</span>
                          {r.account!.emailFailedAt && (
                            <span title={`Email failed: ${r.account!.emailError ?? "unknown error"}`} className="text-amber-600 flex-shrink-0">
                              <AlertCircle size={10} />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <UserCheck size={10} className="flex-shrink-0 text-gray-300" />
                          <span>Access since {formatDate(r.account!.createdAt.split("T")[0])}</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {hasAccount ? (
                      <div className="space-y-2">
                        {/* Reset password */}
                        {resetId === r.account!.id ? (
                          <div className="space-y-2">
                            <div className="relative">
                              <input
                                type={showReset ? "text" : "password"}
                                value={resetPwd}
                                onChange={(e) => { setResetPwd(e.target.value); setResetErr(""); }}
                                placeholder="New password (min 8 chars)"
                                autoComplete="new-password"
                                autoFocus
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8"
                              />
                              <button type="button" onClick={() => setShowReset(!showReset)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                                {showReset ? <EyeOff size={12} /> : <Eye size={12} />}
                              </button>
                            </div>
                            {resetErr && <p className="text-[11px] text-red-500">{resetErr}</p>}
                            <div className="flex gap-2">
                              <button onClick={() => handleReset(r.account!.id)} disabled={resetting || !resetPwd}
                                className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-white bg-[#0a1040] rounded-xl hover:bg-[#0d1550] disabled:opacity-50 transition-colors min-h-[36px]">
                                {resetting ? <Loader2 size={11} className="animate-spin" /> : <Lock size={11} />}
                                {resetting ? "Saving…" : "Save Password"}
                              </button>
                              <button onClick={() => { setResetId(null); setResetPwd(""); setResetErr(""); setShowReset(false); }}
                                className="px-3 py-2 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-xl transition-colors min-h-[36px]">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setResetId(r.account!.id); setResetPwd(""); setResetErr(""); }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#0a1040]/30 hover:text-[#0a1040] transition-colors min-h-[36px]">
                              <RefreshCw size={11} /> Reset Password
                            </button>
                            <button onClick={() => setDeleteId(r.account!.id)}
                              className="px-3 py-2 text-xs text-gray-400 hover:text-red-600 border border-gray-100 rounded-xl hover:border-red-200 hover:bg-red-50 transition-colors min-h-[36px]">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => { setActiveTab("create"); setCreateId(r.memberId); setStep(2); setDir(1); }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors min-h-[36px]">
                        <Plus size={11} /> Create Account
                      </button>
                    )}
                  </div>
                  </PanelCard>
                </motion.div>
              );
            })}
          </div>
        )}

        <ConfirmDialog
          open={deleteId !== null}
          title="Remove portal access?"
          message={deleteId ? `${rows.find((r) => r.account?.id === deleteId)?.memberName ?? "This member"} will no longer be able to log in to the portal.` : undefined}
          confirmLabel="Yes, remove"
          loading={deleting}
          onConfirm={() => deleteId && handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />

        {/* Pagination */}
        {filteredRows.length > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {(tablePage - 1) * PAGE_SIZE + 1}–{Math.min(tablePage * PAGE_SIZE, filteredRows.length)} of {filteredRows.length} members
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                disabled={tablePage === 1}
                className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors min-h-[36px]"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-gray-500 px-2">{tablePage} / {totalPages}</span>
              <button
                onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                disabled={tablePage === totalPages}
                className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors min-h-[36px]"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
