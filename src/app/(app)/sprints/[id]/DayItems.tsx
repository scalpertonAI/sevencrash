"use client";

import { useEffect, useState, useTransition } from "react";
import { sb } from "@/lib/supabase-browser";
import type { DayItem, DayProgress } from "@/types/db";
import { toggleItemDone } from "@/lib/progress";

export function DayItems({ dayId }: { dayId: number | string }) {
  const supabase = sb;
  const [items, setItems] = useState<DayItem[]>([]);
  const [progress, setProgress] = useState<DayProgress | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    setLoading(true);
    const [{ data: itemsData, error: e1 }, { data: progData, error: e2 }] = await Promise.all([
      supabase
        .from("sprint_day_items")
        .select("*")
        .eq("sprint_day_id", dayId)
        .order("position", { ascending: true }),
      supabase
        .from("v_day_progress")
        .select("*")
        .eq("sprint_day_id", dayId)
        .single(),
    ]);

    if (e1) console.error(e1);
    if (e2) console.error(e2);
    setItems((itemsData as any) ?? []);
    setProgress((progData as any) ?? { sprint_day_id: dayId, tasks_done: 0, tasks_total: 0, pct: 0 });
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, [dayId]);

  useEffect(() => {
    const ch = supabase
      .channel(`items-${dayId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sprint_day_items', filter: `sprint_day_id=eq.${dayId}` },
        () => fetchAll()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [dayId]);

  async function onToggle(itemId: string, next: boolean) {
    const prev = items;
    setItems(prev.map(i => i.id === itemId ? { ...i, is_done: next } : i));
    startTransition(async () => {
      try {
        await toggleItemDone(itemId, next);
        fetchAll();
      } catch (e) {
        console.error(e);
        setItems(prev);
        alert("Update failed. Please try again.");
      }
    });
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-40 bg-white/10 rounded" />
        <div className="h-2 w-full bg-white/5 rounded" />
        <div className="h-2 w-11/12 bg-white/5 rounded" />
        <div className="h-2 w-10/12 bg-white/5 rounded" />
      </div>
    );
  }

  const tasks = items.filter(i => i.kind === "task");
  const resources = items.filter(i => i.kind === "resource");

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm opacity-80">Progress</span>
          <span className="text-sm font-medium">{progress?.pct ?? 0}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-2xl h-2">
          <div
            className="h-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
            style={{ width: `${progress?.pct ?? 0}%` }}
          />
        </div>
      </div>

      {/* Tasks */}
      <div>
        <h4 className="text-sm uppercase tracking-wide opacity-75 mb-2">Tasks</h4>
        <ul className="space-y-2">
          {tasks.length === 0 && <li className="text-sm opacity-60">No tasks for this day.</li>}
          {tasks.map(t => (
            <li key={t.id} className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded accent-emerald-400"
                checked={!!t.is_done}
                disabled={isPending}
                onChange={(e) => onToggle(t.id, e.target.checked)}
              />
              <div className="flex-1">
                <p className={`text-sm ${t.is_done ? "line-through opacity-60" : ""}`}>{t.label}</p>
                {t.url && (
                  <a href={t.url} target="_blank" className="text-xs underline opacity-75">
                    Open resource
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Resources */}
      <div>
        <h4 className="text-sm uppercase tracking-wide opacity-75 mb-2">Resources</h4>
        <ul className="space-y-2">
          {resources.length === 0 && <li className="text-sm opacity-60">No resources listed.</li>}
          {resources.map(r => (
            <li key={r.id} className="flex items-start gap-3 p-3 rounded-2xl bg-white/5">
              <div className="h-4 w-4 rounded-full border border-white/20 mt-1" />
              <div className="flex-1">
                <p className="text-sm">{r.label}</p>
                {r.url && (
                  <a href={r.url} target="_blank" className="text-xs underline opacity-75">
                    Open link
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
