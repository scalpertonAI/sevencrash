"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { sb } from "@/lib/supabase-browser";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getUser();
      if (data.user) router.replace("/dashboard");
    })();
  }, [router]);

  return (
    <main className="container mx-auto max-w-md px-4 py-16">
      <div className="card-glass">
        <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
        <Auth
          supabaseClient={sb}
          providers={["google"]}
          appearance={{ theme: ThemeSupa }}
          redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`}
        />
      </div>
    </main>
  );
}
