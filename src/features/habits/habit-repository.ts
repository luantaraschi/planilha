import { getVerifiedUserId } from "@/features/identity/identity-repository";
import { createClient } from "@/lib/supabase/server";

type HabitRow = {
  id: string;
  title: string;
  scheduled_time: string;
};

type HabitLogRow = {
  habit_id: string;
  status: string;
};

export function mergeTodayHabits(
  habits: HabitRow[],
  logs: HabitLogRow[],
) {
  const completed = new Set(
    logs
      .filter((log) => log.status === "completed")
      .map((log) => log.habit_id),
  );
  return habits.map((habit) => ({
    id: habit.id,
    title: habit.title,
    time: habit.scheduled_time.slice(0, 5),
    done: completed.has(habit.id),
  }));
}

export async function getCurrentTodayHabits(date: string) {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
  const [habitResult, logResult] = await Promise.all([
    supabase
      .from("habits")
      .select("id, title, scheduled_time")
      .eq("user_id", userId)
      .eq("active", true)
      .contains("days_of_week", [dayOfWeek])
      .order("scheduled_time"),
    supabase
      .from("habit_logs")
      .select("habit_id, status")
      .eq("user_id", userId)
      .eq("occurred_on", date),
  ]);
  if (habitResult.error || logResult.error) {
    throw new Error("Não foi possível carregar seus hábitos.");
  }
  return mergeTodayHabits(
    (habitResult.data ?? []) as HabitRow[],
    (logResult.data ?? []) as HabitLogRow[],
  );
}
