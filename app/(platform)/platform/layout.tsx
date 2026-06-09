"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Building2, FileText, LogOut, Layers } from "lucide-react";
import "../platform.css";

const navLinks = [
  { href: "/platform/dashboard",     label: "Dashboard",     icon: LayoutDashboard },
  { href: "/platform/associations",  label: "Associations",  icon: Building2 },
  { href: "/platform/logs",          label: "API Logs",      icon: FileText },
];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/platform/login") return <>{children}</>;

  async function handleSignOut() {
    await fetch("/api/platform-auth", { method: "DELETE" });
    router.push("/platform/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-50/80">
      {/* Sidebar */}
      <aside className="platform-sidebar w-60 text-white flex flex-col fixed top-0 left-0 bottom-0 z-40">
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
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
              <Link
                key={href}
                href={href}
                className={`platform-sidebar-link${active ? " active" : ""}`}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
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
      </aside>

      {/* Content */}
      <main className="flex-1 ml-60 p-8 min-h-screen platform-page">
        {children}
      </main>
    </div>
  );
}
