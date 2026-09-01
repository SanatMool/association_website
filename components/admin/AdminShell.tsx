"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Calendar, Newspaper, Award, LogOut, Settings,
  UserCog, CheckSquare, ClipboardList, Tag, CreditCard, CalendarDays,
  KeyRound, BarChart2, ChevronLeft, ChevronRight, Menu, X, Bell, Activity, DollarSign, Clock, Shield, Landmark,
} from "lucide-react";
import SidebarNavItem from "@/components/ui/panel/SidebarNavItem";
import LogoImage from "@/components/ui/LogoImage";
import PullToRefresh from "@/components/ui/PullToRefresh";
import "@/app/(admin)/admin.css";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/members",      label: "Members",      icon: Users },
      { href: "/admin/applications", label: "Applications", icon: ClipboardList },
      { href: "/admin/events",       label: "Events",       icon: Calendar },
      { href: "/admin/news",         label: "News",         icon: Newspaper },
      { href: "/admin/committee",    label: "Committee",    icon: Award },
      { href: "/admin/timeline",     label: "Timeline",     icon: Clock },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/meetings", label: "Meetings", icon: CalendarDays },
      { href: "/admin/tasks",    label: "Tasks",    icon: CheckSquare },
      { href: "/admin/activity", label: "Activity", icon: Activity },
      { href: "/admin/reports",  label: "Reports",  icon: BarChart2 },
    ],
  },
  {
    label: "Financials",
    items: [
      { href: "/admin/finances",              label: "Ledger",           icon: Landmark },
      { href: "/admin/membership/categories", label: "Fee Categories",   icon: Tag },
      { href: "/admin/membership/fees",       label: "Additional Fees",  icon: DollarSign },
      { href: "/admin/membership/dues",       label: "Dues & Payments",  icon: CreditCard },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings",        label: "Settings",        icon: Settings,  adminOnly: true },
      { href: "/admin/users",           label: "Users",           icon: UserCog,   adminOnly: true },
      { href: "/admin/designations",    label: "Designations",    icon: Shield,    adminOnly: true },
      { href: "/admin/portal-accounts", label: "Portal Accounts", icon: KeyRound,  permission: "members.edit" },
    ],
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingApps, setPendingApps] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [assocName, setAssocName] = useState("");

  useEffect(() => {
    if (pathname === "/admin/login") return;
    fetch("/api/admin/branding")
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;
        if (res.data.logo) setLogoUrl(res.data.logo);
        if (res.data.name) setAssocName(res.data.name);
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((res) => { if (res.success) setPendingApps(res.data.pendingApplications); })
      .catch(() => {});
  }, [session, pathname]);

  useEffect(() => {
    if (pathname !== "/admin/login" && status === "unauthenticated") {
      window.location.href = "/admin/login";
    }
  }, [status, pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (pathname === "/admin/login") return <>{children}</>;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!session) return null;

  async function handleSignOut() {
    await signOut({ redirect: false });
    window.location.href = "/admin/login";
  }

  const sessionUser = session.user as { systemRole?: string } | undefined;
  const systemRole = sessionUser?.systemRole ?? "admin";

  function LogoMark({ width, height, className }: { width: number; height: number; className: string }) {
    if (logoUrl) return <LogoImage src={logoUrl} alt={assocName || "Association logo"} width={width} height={height} className={className} />;
    return (
      <div
        className={`rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <Landmark size={Math.round(height * 0.55)} className="text-amber-400" />
      </div>
    );
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`border-b border-white/10 ${collapsed ? "flex flex-col items-center gap-1 px-2 py-3" : "flex items-center justify-between px-5 pt-5 pb-4"}`}>
        {!collapsed && (
          <Link href="/admin/dashboard" className="flex flex-col items-center flex-1 min-w-0">
            <LogoMark width={160} height={102} className="h-12 w-auto" />
            {assocName && <div className="text-xs text-white/70 font-medium mt-1.5 truncate max-w-full px-2">{assocName}</div>}
            <div className="text-[9px] text-white/25 mt-1 tracking-[0.2em] uppercase font-medium">Admin Panel</div>
          </Link>
        )}
        {collapsed && (
          <Link href="/admin/dashboard" className="flex justify-center w-full">
            <LogoMark width={44} height={44} className="h-9 w-auto" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={`hidden lg:flex w-6 h-6 items-center justify-center text-white/30 hover:text-white/70 transition-colors rounded flex-shrink-0 ${collapsed ? "mt-1" : ""}`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 overflow-y-auto space-y-4 pt-3">
        {NAV_GROUPS.map(({ label, items }) => {
          const visibleItems = items.filter((item) => {
            const anyItem = item as { adminOnly?: boolean };
            if (anyItem.adminOnly && systemRole !== "admin") return false;
            return true;
          });
          if (visibleItems.length === 0) return null;
          return (
            <div key={label}>
              {!collapsed && (
                <div className="px-3 mb-1 text-[10px] font-semibold text-white/25 uppercase tracking-widest">{label}</div>
              )}
              {collapsed && <div className="border-t border-white/5 mb-2 mx-1" />}
              <div className="space-y-0.5">
                {visibleItems.map(({ href, label: itemLabel, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <SidebarNavItem
                      key={href}
                      href={href}
                      label={itemLabel}
                      icon={Icon}
                      active={active}
                      accent="gold"
                      collapsed={collapsed}
                      layoutId="admin-active-nav"
                      badge={href === "/admin/applications" ? pendingApps : undefined}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className={`border-t border-white/10 p-3 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 mb-2 px-1">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-amber-400">
                {session.user?.name?.[0]?.toUpperCase() ?? session.user?.email?.[0]?.toUpperCase() ?? "A"}
              </span>
            </div>
            <div className="min-w-0">
              {session.user?.name && <div className="text-xs font-medium text-white/70 truncate">{session.user.name}</div>}
              <div className="text-[10px] text-white/35 truncate">{session.user?.email}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
          className={`flex items-center gap-2 text-xs text-white/40 hover:text-white/80 transition-colors rounded py-1 ${collapsed ? "justify-center w-full" : "px-1 w-full"}`}
        >
          <LogOut size={13} />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </>
  );

  return (
    <PullToRefresh>
    <div className="min-h-screen flex bg-gray-50/80">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — desktop fixed, mobile overlay */}
      <motion.aside
        animate={{ width: collapsed ? 60 : 256 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className={`bg-mesh-navy text-white flex flex-col fixed top-0 left-0 bottom-0 z-40 shadow-[4px_0_24px_rgba(10,16,64,0.18)]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} transition-transform duration-200
        `}
        style={{ width: collapsed ? 60 : 256 }}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile close button (inside sidebar when open) */}
      {mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          className="fixed top-4 right-4 z-50 lg:hidden text-white/60 hover:text-white bg-[#0a1040] rounded-lg p-2"
        >
          <X size={16} />
        </button>
      )}

      {/* Content */}
      <main className={`flex-1 min-h-screen admin-page transition-all duration-200 ${collapsed ? "lg:ml-[60px]" : "lg:ml-64"} ml-0`}>
        {/* Mobile header bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu size={18} />
          </button>
          <LogoMark width={80} height={51} className="h-6 w-auto" />
          <span className="text-xs text-gray-400 font-medium flex-1">Admin Panel</span>
          <Link href="/admin/applications" className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Bell size={17} />
            {pendingApps > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {pendingApps > 9 ? "9+" : pendingApps}
              </span>
            )}
          </Link>
        </div>

        <div className="p-4 sm:p-8">{children}</div>
      </main>
    </div>
    </PullToRefresh>
  );
}
