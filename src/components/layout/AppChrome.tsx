"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { LogOut, LayoutDashboard, ListChecks, Star } from "lucide-react";

function initialsFromEmail(email?: string | null) {
  if (!email) return "U";
  const name = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ").trim();
  const parts = name.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Guard: if no session, go to /login
  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getUser();
      if (!data.user) {
        router.replace("/login");
      } else {
        setEmail(data.user.email ?? null);
      }
      setLoading(false);
    })();
  }, [router]);

  const nav = useMemo(
    () => [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/sprints", label: "My Sprints", icon: <ListChecks className="h-4 w-4" /> }, // (optional future page)
      { href: "/certs", label: "Certificates", icon: <Star className="h-4 w-4" /> },       // (optional future page)
    ],
    []
  );

  async function signOut() {
    await sb.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="card-glass">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="bg-white/70 border-r">
        <div className="p-4">
          <Link href="/" className="font-semibold text-lg">SevenCrash</Link>
        </div>
        <nav className="px-2 pb-4 space-y-1">
          {nav.map((item) => {
            const active =
              item.href === "/sprints"
                ? pathname?.startsWith("/sprints")
                : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 border transition
                  ${active ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50"}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main column */}
      <div className="min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
          <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
            <div className="text-sm text-gray-600">AI 7-Day Crash Courses</div>

            <div className="flex items-center gap-3">
              {/* Avatar chip */}
              <div className="flex items-center gap-2 border rounded-xl bg-white px-3 py-1">
                <div className="h-7 w-7 rounded-full bg-blue-600 text-white grid place-items-center text-xs font-bold">
                  {initialsFromEmail(email)}
                </div>
                <div className="text-sm text-gray-700 max-w-[140px] truncate">{email}</div>
              </div>

              <button onClick={signOut} className="btn-ghost inline-flex items-center gap-1">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
