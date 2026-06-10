"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Calendar, Users2, CreditCard, LogOut } from "lucide-react";

const navLinks = [
  { href: "/portal",          label: "Home",     icon: LayoutDashboard, exact: true },
  { href: "/portal/events",   label: "Events",   icon: Calendar },
  { href: "/portal/meetings", label: "Meetings", icon: Users2 },
  { href: "/portal/dues",     label: "My Dues",  icon: CreditCard },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  if (pathname === "/portal/login") return <>{children}</>;

  async function handleSignOut() {
    await fetch("/api/portal-auth", { method: "DELETE" });
    router.push("/portal/login");
  }

  return (
    <div className="min-h-screen bg-gray-50/80 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#0a1040] text-white flex flex-col fixed top-0 left-0 bottom-0 z-40">
        <div className="px-5 pt-5 pb-4 border-b border-white/10">
          <div className="text-sm font-bold text-white">Member Portal</div>
          <div className="text-[10px] text-white/30 mt-0.5 tracking-widest uppercase">Association</div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navLinks.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? "bg-white/10 text-white font-medium" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-white/50 hover:text-white/90 transition-colors px-1 py-1 w-full rounded">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-56 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
