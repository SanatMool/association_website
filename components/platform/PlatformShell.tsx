"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Building2, FileText, LogOut, Layers, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import SidebarNavItem from "@/components/ui/panel/SidebarNavItem";

const navLinks = [
  { href: "/platform/dashboard",     label: "Dashboard",     icon: LayoutDashboard },
  { href: "/platform/associations",  label: "Associations",  icon: Building2 },
  { href: "/platform/logs",          label: "API Logs",      icon: FileText },
];

export default function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (pathname === "/platform/login") return <>{children}</>;

  async function handleSignOut() {
    await fetch("/api/platform-auth", { method: "DELETE" });
    router.push("/platform/login");
  }

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))", border: "1px solid rgba(99,102,241,0.35)" }}>
            <Layers size={16} className="text-indigo-300" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">nibjar</div>
            <div className="text-[9px] text-white/30 tracking-[0.18em] uppercase font-medium">Platform Admin</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <SidebarNavItem
              key={href}
              href={href}
              label={label}
              icon={Icon}
              active={active}
              accent="indigo"
              layoutId="platform-active-nav"
            />
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs text-white/50 hover:text-white/90 transition-colors px-1 py-1 w-full rounded"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
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

      {/* Sidebar */}
      <aside className={`bg-mesh-indigo w-60 text-white flex flex-col fixed top-0 left-0 bottom-0 z-40 shadow-[4px_0_24px_rgba(30,27,75,0.25)] transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          className="fixed top-4 right-4 z-50 lg:hidden text-white/60 hover:text-white bg-[#1e1b4b] rounded-lg p-2"
        >
          <X size={16} />
        </button>
      )}

      {/* Content */}
      <main className="flex-1 lg:ml-60 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-700">nibjar Platform</span>
        </div>
        <div className="p-4 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
