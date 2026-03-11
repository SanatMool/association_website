"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Users, Calendar, Newspaper, Award, LogOut, Settings, UserCog, CheckSquare } from "lucide-react";
import "../admin.css";

const navLinks = [
  { href: "/admin/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/members",    label: "Members",    icon: Users },
  { href: "/admin/events",     label: "Events",     icon: Calendar },
  { href: "/admin/news",       label: "News",       icon: Newspaper },
  { href: "/admin/committee",  label: "Committee",  icon: Award },
  { href: "/admin/tasks",      label: "Tasks",      icon: CheckSquare },
  { href: "/admin/settings",   label: "Settings",   icon: Settings },
  { href: "/admin/users",      label: "Users",      icon: UserCog },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/admin/login" && status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router, pathname]);

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
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-50/80">
      {/* Sidebar */}
      <aside className="admin-sidebar w-64 text-white flex flex-col fixed top-0 left-0 bottom-0 z-40">
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b border-white/10">
          <Link href="/admin/dashboard" className="block">
            <Image
              src="/evanepal.png"
              alt="EVA Nepal"
              width={120}
              height={77}
              className="h-8 w-auto brightness-0 invert"
            />
          </Link>
          <div className="text-[9px] text-white/25 mt-2 tracking-[0.2em] uppercase font-medium">Admin Panel</div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`admin-sidebar-link${active ? " active" : ""}`}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 mb-3 px-1">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-amber-400">
                {session.user?.name?.[0]?.toUpperCase() ?? session.user?.email?.[0]?.toUpperCase() ?? "A"}
              </span>
            </div>
            <div className="min-w-0">
              {session.user?.name && (
                <div className="text-xs font-medium text-white/70 truncate">{session.user.name}</div>
              )}
              <div className="text-[10px] text-white/35 truncate">{session.user?.email}</div>
            </div>
          </div>
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
      <main className="flex-1 ml-64 p-8 min-h-screen admin-page">
        {children}
      </main>
    </div>
  );
}
