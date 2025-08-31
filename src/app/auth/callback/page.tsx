"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sb } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState("Finishing sign-in…");

  useEffect(() => {
    (async () => {
      try {
        const code = params.get("code");
        if (code) {
          // FIXED: pass string, not object
          const { error } = await sb.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        setMsg("Signed in. Redirecting…");
        router.replace("/dashboard");
      } catch (e: any) {
        setMsg("Sign-in failed.");
        setTimeout(() => router.replace("/login"), 1500);
      }
    })();
  }, [params, router]);

  return (
    <main className="container mx-auto max-w-md px-4 py-16">
      <div className="card-glass">
        <h1 className="text-xl font-semibold mb-2">Auth Callback</h1>
        <p>{msg}</p>
      </div>
    </main>
  );
}
