"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Calendar, Users2, CreditCard, LogOut, User, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import SidebarNavItem from "@/components/ui/panel/SidebarNavItem";

interface Branding {
  name: string;
  logo: string | null;
  memberName: string;
  memberInitial: string;
}

interface DuesStatus { pendingCount: number }

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname();
  const router       = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [branding,   setBranding]   = useState<Branding | null>(null);
  const [dues,       setDues]       = useState<DuesStatus>({ pendingCount: 0 });

  useEffect(() => {
    if (pathname === "/portal/login") return;
    fetch("/api/portal/me").then((r) => r.json()).then((res: { success: boolean; data: { member: { name: string }; association: { name: string; logo: string | null } } }) => {
      if (!res.success) return;
      const { member, association } = res.data;
      setBranding({
        name:          association.name,
        logo:          association.logo,
        memberName:    member.name,
        memberInitial: member.name?.[0]?.toUpperCase() ?? "M",
      });
    }).catch(() => {});
    fetch("/api/portal/dues").then((r) => r.json()).then((res: { success: boolean; data: { status: string }[] }) => {
      if (!res.success) return;
      setDues({ pendingCount: res.data.filter((d) => d.status === "pending").length });
    }).catch(() => {});
  }, [pathname]);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (pathname === "/portal/login") return <>{children}</>;

  async function handleSignOut() {
    await fetch("/api/portal-auth", { method: "DELETE" });
    router.push("/portal/login");
  }

  const navLinks = [
    { href: "/portal",          label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/portal/events",   label: "Events",    icon: Calendar },
    { href: "/portal/meetings", label: "Meetings",  icon: Users2 },
    { href: "/portal/dues",     label: "My Dues",   icon: CreditCard, badge: dues.pendingCount > 0 ? dues.pendingCount : 0 },
    { href: "/portal/profile",  label: "Profile",   icon: User },
  ];

  const sidebarContent = (
    <>
      {/* Logo / Branding */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        {branding?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logo} alt={branding.name} className="h-9 w-auto mb-1" />
        ) : (
          <div className="text-sm font-bold text-white">{branding?.name ?? "Member Portal"}</div>
        )}
        <div className="text-[10px] text-white/30 mt-0.5 tracking-widest uppercase">Member Portal</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon, exact, badge }) => {
          const active = (exact ?? false) ? pathname === href : pathname.startsWith(href);
          return (
            <SidebarNavItem
              key={href}
              href={href}
              label={label}
              icon={Icon}
              active={active}
              accent="gold"
              layoutId="portal-active-nav"
              badge={badge}
            />
          );
        })}
      </nav>

      {/* Member footer */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {branding && (
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-amber-400">{branding.memberInitial}</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-white/70 truncate">{branding.memberName}</div>
              <div className="text-[10px] text-white/30">Member</div>
            </div>
          </div>
        )}
        <button onClick={handleSignOut}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-white/80 transition-colors px-1 py-1 w-full rounded">
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50/80 flex">
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
      <aside className={`w-56 bg-mesh-navy text-white flex flex-col fixed top-0 left-0 bottom-0 z-40 shadow-[4px_0_24px_rgb(var(--navy-800)/0.18)] transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {sidebarContent}
      </aside>

      {/* Mobile close button */}
      {mobileOpen && (
        <button onClick={() => setMobileOpen(false)}
          className="fixed top-4 right-4 z-50 lg:hidden text-white/60 hover:text-white bg-navy-800 rounded-lg p-2">
          <X size={16} />
        </button>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-56 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-700">{branding?.name ?? "Member Portal"}</span>
        </div>
        <div className="p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
