export type DayItem = {
    id: string;
    sprint_day_id: number | string; // bigint in DB
    kind: "task" | "resource";
    label: string;
    url: string | null;
    position: number;
    is_done: boolean;
  };
  
  export type DayProgress = {
    sprint_day_id: number | string;
    tasks_total: number;
    tasks_done: number;
    pct: number;
  };
  
  export type ProfileStreak = {
    streak_current: number;
    streak_best: number;
    total_tasks_completed: number;
    last_completed_day: string | null;
  };
  