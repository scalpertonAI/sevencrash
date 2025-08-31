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
        // Supabase can return either a "code" (PKCE OAuth) or tokens in hash (magic link)
        const code = params.get("code");
        if (code) {
          const { error } = await sb.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // if no code, try to see if session already exists (magic-link case)
          await sb.auth.getSession();
        }

        setMsg("Signed in. Redirecting…");
        router.replace("/dashboard");
      } catch (e: any) {
        console.error(e);
        setMsg(e?.message || "Sign-in failed. Try again.");
        // Optionally bounce back to login after a moment:
        setTimeout(() => router.replace("/login"), 2000);
      }
    })();
  }, [params, router]);

  return (
    <main className="container mx-auto max-w-md px-4 py-16">
      <div className="card-glass">
        <h1 className="text-xl font-semibold mb-2">Auth Callback</h1>
        <p className="text-gray-600">{msg}</p>
      </div>
    </main>
  );
}
