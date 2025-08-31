"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase-browser";

export default function HeaderAuthButtons() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getUser();
      setLoggedIn(!!data.user);
    })();
  }, []);

  if (loggedIn === null) return null; // avoid flicker

  return loggedIn ? (
    <Link href="/dashboard" className="btn-ghost">Dashboard</Link>
  ) : (
    <Link href="/login" className="btn-ghost">Login</Link>
  );
}
