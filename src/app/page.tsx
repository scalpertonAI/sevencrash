"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("Python");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<null | boolean>(null);
  const [err, setErr] = useState<string | null>(null);

  async function joinWaitlist() {
    setLoading(true); setOk(null); setErr(null);
    try {
      const payload = { email: email.trim(), topic: (topic || "").trim() };
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      setOk(j.ok);
      if (!j.ok) setErr(j.error || "Unknown error");
    } catch (e:any) {
      setOk(false); setErr(e?.message || "Network error");
    } finally { setLoading(false); }
  }

  return (
    <main className="container mx-auto max-w-6xl px-4">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <span className="font-semibold">SevenCrash</span>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">beta</span>
        </div>
        <div className="hidden sm:flex gap-2">
          <a href="#" className="btn-ghost">Features</a>
          <a href="#" className="btn-ghost">Pricing</a>
          <a href="/login" className="btn-ghost">Login</a>
        </div>
      </header>

      <section className="mt-6 grid gap-8 lg:grid-cols-2 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Learn <span className="text-blue-600">anything</span> in 7 days.
          </h1>
          <p className="text-gray-600">Type what you want to learn. Get a 7‑day roadmap with daily tasks & a quick quiz. Share wins, build streaks.</p>

          <div className="card-glass">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <Input type="email" placeholder="you@email.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
              <Input placeholder="I want to learn… (e.g., Python)" value={topic} onChange={(e)=>setTopic(e.target.value)} />
              <Button onClick={joinWaitlist} loading={loading}>Join waitlist</Button>
            </div>
            {ok === true && <p className="mt-3 text-green-600">You’re in! 🎉</p>}
            {ok === false && <p className="mt-3 text-red-600">Error: {err}</p>}
            <p className="mt-2 text-xs text-gray-500">No spam. Unsubscribe anytime.</p>
          </div>
        </div>

        <div className="relative">
          <div className="card-glass">
            <Card className="mb-4">
              <CardTitle>Day 1 • Python</CardTitle>
              <CardDesc>Intro to syntax, variables, I/O</CardDesc>
            </Card>
            <Card className="mb-4">
              <CardTitle>Day 2 • Python</CardTitle>
              <CardDesc>Control flow: if/else, loops</CardDesc>
            </Card>
            <Card>
              <CardTitle>Day 3 • Python</CardTitle>
              <CardDesc>Lists, dicts, sets</CardDesc>
            </Card>
            <p className="mt-4 text-gray-600 text-sm">…auto-generated up to Day 7</p>
          </div>
        </div>
      </section>

      <footer className="py-12 text-sm text-gray-600 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <p>© {new Date().getFullYear()} SevenCrash. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
            <a href="#" className="hover:underline">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
