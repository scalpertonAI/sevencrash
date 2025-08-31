"use client";

import { useEffect, useMemo, useState } from "react";
import { sb } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/ui/progress";

type Sprint = { id: string; topic: string; created_at: string };
type SprintWithProgress = Sprint & { completion: number };

function generateSevenDayPlan(topic: string) {
  const t = topic.trim();
  const nice = (s: string) => s.replace("%TOPIC%", t);
  return [
    { day: 1, title: nice("Kickoff: %TOPIC% 101"), tasks: ["Read a 20-min intro", "Install tools", "Run a Hello World"], resources: [{ title: "Quickstart", url: "https://example.com" }] },
    { day: 2, title: nice("Foundations of %TOPIC%"), tasks: ["Learn core concepts", "Do 30-min practice"], resources: [] },
    { day: 3, title: nice("%TOPIC% in action"), tasks: ["Build a tiny demo"], resources: [] },
    { day: 4, title: nice("%TOPIC% patterns"), tasks: ["Study 3 patterns", "Apply one to your demo"], resources: [] },
    { day: 5, title: nice("Intermediate %TOPIC%"), tasks: ["Add a new feature", "Refactor code"], resources: [] },
    { day: 6, title: nice("Project day"), tasks: ["Build a small project end-to-end"], resources: [] },
    { day: 7, title: nice("Review & quiz"), tasks: ["Self-quiz", "Write a 200-word summary"], resources: [] },
  ];
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [streak, setStreak] = useState<number>(0);

  const [topic, setTopic] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sprints, setSprints] = useState<SprintWithProgress[]>([]);
  const topicOk = useMemo(() => topic.trim().length >= 2, [topic]);

  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getUser();
      if (!data.user) return router.replace("/login");
      setEmail(data.user.email ?? null);

      // load sprints
      const { data: rows, error: sErr } = await sb
        .from("sprints")
        .select("id, topic, created_at")
        .order("created_at", { ascending: false });
      if (sErr) {
        console.error(sErr);
        return;
      }

      // compute completion %
      if (rows && rows.length) {
        const ids = rows.map((r) => r.id);

        const { data: allDays, error: dErr } = await sb
          .from("sprint_days")
          .select("id, sprint_id, tasks");
        if (dErr) console.error(dErr);

        const { data: allProgress, error: pErr } = await sb
          .from("sprint_progress")
          .select("sprint_day_id, completed_task_indexes");
        if (pErr) console.error(pErr);

        const progressMap: Record<string, number> = {};
        ids.forEach((sid) => {
          const days = (allDays || []).filter((d) => d.sprint_id === sid);
          const tasksTotal = days.reduce((acc, d) => acc + d.tasks.length, 0);
          const completed = (allProgress || [])
            .filter((p) => days.some((d) => d.id === p.sprint_day_id))
            .reduce((acc, p) => acc + (p.completed_task_indexes?.length || 0), 0);
          progressMap[sid] = tasksTotal ? Math.round((completed / tasksTotal) * 100) : 0;
        });

        setSprints(rows.map((r) => ({ ...r, completion: progressMap[r.id] || 0 })));
      } else {
        setSprints([]);
      }

      // load streak
      const { data: prof } = await sb.from("profiles").select("streak").single();
      if (prof?.streak != null) setStreak(prof.streak);
    })();
  }, [router]);

  async function createSprint() {
    setError(null);
    if (!topicOk) return setError("Please enter a topic (min 2 chars).");
    setCreating(true);
    try {
      const { data: userResp } = await sb.auth.getUser();
      const user = userResp.user;
      if (!user) return router.replace("/login");

      // 1) Create sprint
      const { data: sprintRow, error: sprintErr } = await sb
        .from("sprints")
        .insert({ user_id: user.id, topic: topic.trim() })
        .select("id, topic, created_at")
        .single();
      if (sprintErr || !sprintRow) throw new Error(sprintErr?.message || "Failed to create sprint");

      // 2) Insert 7 days
      const plan = generateSevenDayPlan(topic);
      const daysPayload = plan.map((p) => ({
        sprint_id: sprintRow.id,
        day_index: p.day,
        title: p.title,
        tasks: p.tasks,
        resources: p.resources,
      }));
      const { error: daysErr } = await sb.from("sprint_days").insert(daysPayload);
      if (daysErr) throw new Error(daysErr.message);

      // 3) update list + go
      setTopic("");
      setSprints((prev) => [{ ...sprintRow, completion: 0 }, ...prev]);
      router.push(`/sprints/${sprintRow.id}`);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header / Streak */}
      <div className="card-glass mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-gray-600">Signed in as {email}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Current Streak</div>
          <div className="text-xl font-bold text-orange-600">{streak} 🔥</div>
        </div>
      </div>

      {/* Create Sprint */}
      <div className="card-glass mb-8">
        <h2 className="text-xl font-semibold mb-3">Create a 7-Day Sprint</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            className="input"
            placeholder="What do you want to learn? (e.g., Python, UI/UX, Trading)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button className="btn-primary" disabled={!topicOk || creating} onClick={createSprint}>
            {creating ? "Creating…" : "Create Sprint"}
          </button>
        </div>
        {error && <p className="text-red-600 mt-2">{error}</p>}
        <p className="text-xs text-gray-500 mt-2">We’ll auto-generate 7 focused days you can follow.</p>
      </div>

      {/* List Sprints with progress */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sprints.map((s) => (
          <a key={s.id} href={`/sprints/${s.id}`} className="card-glass hover:shadow-md transition p-4">
            <div className="text-sm text-gray-500">{new Date(s.created_at).toLocaleDateString()}</div>
            <div className="text-lg font-semibold mb-2">{s.topic}</div>
            <ProgressBar value={s.completion} />
            <div className="text-sm text-gray-600 mt-1">{s.completion}% complete</div>
          </a>
        ))}
        {sprints.length === 0 && (
          <div className="text-gray-500">No sprints yet. Create your first one above.</div>
        )}
      </div>
    </main>
  );
}
