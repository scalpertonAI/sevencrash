"use client";

import { useEffect, useMemo, useState } from "react";
import { sb } from "@/lib/supabase-browser";
import { useParams, useRouter } from "next/navigation";

type DayRow = {
  id: number;
  day_index: number;
  title: string;
  tasks: string[];
  resources: { title: string; url?: string }[];
};

type ProgressRow = {
  sprint_day_id: number;
  completed_task_indexes: number[];
};

export default function SprintPage() {
  const { id: sprintId } = useParams<{ id: string }>();
  const router = useRouter();

  const [topic, setTopic] = useState<string>("");
  const [days, setDays] = useState<DayRow[]>([]);
  const [progress, setProgress] = useState<Record<number, Set<number>>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const dayById = useMemo(() => {
    const m = new Map<number, DayRow>();
    days.forEach((d) => m.set(d.id, d));
    return m;
  }, [days]);

  useEffect(() => {
    (async () => {
      try {
        const { data: user } = await sb.auth.getUser();
        if (!user.user) return router.replace("/login");
        setUserId(user.user.id);

        const { data: sData, error: sErr } = await sb
          .from("sprints")
          .select("topic")
          .eq("id", sprintId)
          .single();
        if (sErr || !sData) throw new Error(sErr?.message || "Sprint not found");
        setTopic(sData.topic);

        const { data: dData, error: dErr } = await sb
          .from("sprint_days")
          .select("id, day_index, title, tasks, resources")
          .eq("sprint_id", sprintId)
          .order("day_index", { ascending: true });
        if (dErr) throw new Error(dErr.message);
        setDays(dData || []);

        const dayIds = (dData || []).map((d) => d.id);
        if (dayIds.length) {
          const { data: pData, error: pErr } = await sb
            .from("sprint_progress")
            .select("sprint_day_id, completed_task_indexes")
            .in("sprint_day_id", dayIds);
          if (pErr) throw new Error(pErr.message);

          const map: Record<number, Set<number>> = {};
          (pData || []).forEach((p: ProgressRow) => {
            map[p.sprint_day_id] = new Set(p.completed_task_indexes || []);
          });
          setProgress(map);
        }
      } catch (e: any) {
        setErr(e?.message || "Failed to load sprint");
      } finally {
        setLoading(false);
      }
    })();
  }, [sprintId, router]);

  async function toggleTask(day: DayRow, taskIndex: number) {
    if (!userId) return;

    // optimistic UI
    setProgress((prev) => {
      const next = { ...prev };
      const set = new Set(next[day.id] || []);
      if (set.has(taskIndex)) set.delete(taskIndex);
      else set.add(taskIndex);
      next[day.id] = set;
      return next;
    });

    // compute final set to persist
    const current = new Set(progress[day.id] || []);
    if (current.has(taskIndex)) current.delete(taskIndex);
    else current.add(taskIndex);
    const arr = Array.from(current).sort((a, b) => a - b);

    const { error } = await sb
      .from("sprint_progress")
      .upsert(
        {
          user_id: userId,
          sprint_id: sprintId as string,
          sprint_day_id: day.id,
          completed_task_indexes: arr,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,sprint_day_id" }
      );

    if (error) {
      // rollback on error
      setProgress((prev) => {
        const next = { ...prev };
        const set = new Set(next[day.id] || []);
        if (set.has(taskIndex)) set.delete(taskIndex);
        else set.add(taskIndex);
        next[day.id] = set;
        return next;
      });
      console.error(error);
      alert("Could not save progress: " + error.message);
      return;
    }

    // if all tasks complete now, bump streak
    const totalTasks = day.tasks.length;
    if (arr.length === totalTasks && totalTasks > 0) {
      await updateStreakIfNeeded();
    }
  }

  async function updateStreakIfNeeded() {
    if (!userId) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const { data: prof, error: readErr } = await sb
      .from("profiles")
      .select("id, last_active_date, streak")
      .eq("id", userId)
      .single();
    if (readErr) {
      console.error("profile read error:", readErr);
      return;
    }

    const last = prof?.last_active_date as string | null;
    const toDate = (s: string) => new Date(s + "T00:00:00");
    const oneDayMs = 24 * 60 * 60 * 1000;

    let newStreak = 1;
    if (last) {
      const lastT = toDate(last).getTime();
      const todayT = toDate(todayStr).getTime();
      if (lastT === todayT) {
        return; // already counted today
      } else if (todayT - lastT === oneDayMs) {
        newStreak = (prof?.streak || 0) + 1;
      } else {
        newStreak = 1;
      }
    }

    const { error: updErr } = await sb
      .from("profiles")
      .update({ last_active_date: todayStr, streak: newStreak })
      .eq("id", userId);
    if (updErr) console.error("profile update error:", updErr);
  }

  if (loading) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="card-glass">Loading sprint…</div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="card-glass">
          <p className="text-red-600">Error: {err}</p>
          <a className="btn-ghost mt-3 inline-block" href="/dashboard">← Back to dashboard</a>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="card-glass mb-6">
        <h1 className="text-2xl font-semibold">{topic} — 7-Day Sprint</h1>
        <p className="text-gray-600">Check tasks as you complete them. Your streak updates when a day is finished.</p>
      </div>

      <div className="grid gap-4">
        {days.map((d) => {
          const set = progress[d.id] || new Set<number>();
          const allDone = d.tasks.length > 0 && set.size === d.tasks.length;
          return (
            <div key={d.id} className="card-glass">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Day {d.day_index}</div>
                  <div className="text-lg font-semibold">{d.title}</div>
                </div>
                {allDone && (
                  <span className="text-green-600 text-sm font-medium">✓ Completed</span>
                )}
              </div>

              <div className="mt-3">
                <div className="font-medium mb-1">Tasks</div>
                <ul className="grid gap-2">
                  {d.tasks.map((t, i) => {
                    const checked = set.has(i);
                    return (
                      <li key={i} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTask(d, i)}
                          className="mt-1 h-4 w-4"
                        />
                        <span className={checked ? "line-through text-gray-500" : ""}>{t}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {d.resources?.length ? (
                <div className="mt-3">
                  <div className="font-medium mb-1">Resources</div>
                  <ul className="list-disc ml-5 text-gray-700">
                    {d.resources.map((r, i) => (
                      <li key={i}>
                        {r.url ? (
                          <a className="text-brand underline" href={r.url} target="_blank" rel="noreferrer">
                            {r.title}
                          </a>
                        ) : (
                          r.title
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <a className="btn-ghost inline-block" href="/dashboard">← Back to dashboard</a>
      </div>
    </main>
  );
}
