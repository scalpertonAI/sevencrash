"use client";

import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getUser();
      if (!data.user) {
        router.replace("/login");
      } else {
        setEmail(data.user.email);
      }
    })();
  }, [router]);

  async function signOut() {
    await sb.auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-16">
      <div className="card-glass">
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
        <p>Welcome {email}</p>
        <button onClick={signOut} className="btn-primary mt-4">Logout</button>
      </div>
    </main>
  );
}
