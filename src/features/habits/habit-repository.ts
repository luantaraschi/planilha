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

export type Habit = {
  id: string;
  title: string;
  scheduledTime: string;
  done: boolean;
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

export async function addCurrentHabit(title: string, scheduledTime: string) {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const { error } = await supabase
    .from("habits")
    .insert({ user_id: userId, title, scheduled_time: scheduledTime });
  return !error;
}

export async function getCurrentHabits(date: string): Promise<Habit[]> {
  const habits = await getCurrentTodayHabits(date);
  return habits.map((habit) => ({
    id: habit.id,
    title: habit.title,
    scheduledTime: habit.time ?? "",
    done: habit.done,
  }));
}

export async function setCurrentHabitStatus(
  habitId: string,
  occurredOn: string,
  status: "completed" | "skipped",
) {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const { error } = await supabase.from("habit_logs").upsert(
    {
      user_id: userId,
      habit_id: habitId,
      occurred_on: occurredOn,
      status,
    },
    { onConflict: "habit_id,user_id,occurred_on" },
  );
  return !error;
}
