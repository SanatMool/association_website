"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Users, Calendar, Newspaper, Award, LogOut, Settings, UserCog } from "lucide-react";

const navLinks = [
  { href: "/admin/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/members",    label: "Members",    icon: Users },
  { href: "/admin/events",     label: "Events",     icon: Calendar },
  { href: "/admin/news",       label: "News",       icon: Newspaper },
  { href: "/admin/committee",  label: "Committee",  icon: Award },
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
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0a1040] text-white flex flex-col fixed top-0 left-0 bottom-0 z-40">
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <Link href="/admin/dashboard">
            <Image
              src="/evanepal.png"
              alt="EVA Nepal"
              width={120}
              height={77}
              className="h-8 w-auto brightness-0 invert"
            />
          </Link>
          <div className="text-[10px] text-white/30 mt-1.5 tracking-widest uppercase">Admin Panel</div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-amber-500 text-white"
                    : "text-white/65 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-white/40 mb-2 truncate px-1">{session.user?.email}</div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors px-1 py-1"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 ml-60 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
