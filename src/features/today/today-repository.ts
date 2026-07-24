import {
  buildMonthlyFinanceSummary,
  dateInTimeZone,
} from "@/features/finance/finance-model";
import { getCurrentFinanceLedger } from "@/features/finance/finance-repository";
import { getCalendarOccurrences } from "@/features/calendar/calendar-repository";
import { getCurrentTodayHabits } from "@/features/habits/habit-repository";
import { getCurrentTasks } from "@/features/tasks/task-repository";
import type { TodaySnapshot, TimelineItem } from "./today-model";
import { localDayWindow } from "@/lib/date-time";

type OccurrenceInput = {
  id: string;
  source_id: string;
  kind: string;
  title: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  location: string | null;
  source: string;
  last_synced_at: string | null;
  estimated_minutes: number | null;
  parent_event_id: string | null;
};

type TodayInput = {
  date: Date;
  greetingName: string;
  timeZone: string;
  occurrences: OccurrenceInput[];
  priorities: TodaySnapshot["priorities"];
  habits: TodaySnapshot["habits"];
  freeToSpendCents: number;
  projectedBalanceCents: number;
};

function occurrenceDetail(
  item: OccurrenceInput,
  detailTime: Intl.DateTimeFormat,
) {
  if (item.source !== "local") {
    const source = item.source === "google" ? "Google Agenda" : item.source;
    return item.last_synced_at
      ? `${source} · sincronizado ${detailTime.format(new Date(item.last_synced_at))}`
      : source;
  }
  if (item.kind === "task") {
    return item.estimated_minutes
      ? `${item.estimated_minutes} min`
      : "Tarefa agendada";
  }
  if (item.kind === "bill") return "Conta planejada";
  return item.location ?? "Agenda local";
}

export function composeTodaySnapshot(input: TodayInput): TodaySnapshot {
  const detailTime = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: input.timeZone,
  });
  const occurrenceTimeline = [...input.occurrences].map(
      (item): TimelineItem => ({
        id: item.id,
        time: detailTime.format(new Date(item.starts_at)),
        title: item.title,
        kind: item.kind === "bill" ? "bill" : item.kind === "task" ? "task" : "event",
        detail: occurrenceDetail(item, detailTime),
      }),
    );
  const timeline = [
    ...occurrenceTimeline,
    ...input.habits
      .filter((habit) => habit.time)
      .map(
        (habit): TimelineItem => ({
          id: `habit:${habit.id}`,
          time: habit.time!,
          title: habit.title,
          kind: "habit",
          detail: habit.done ? "Hábito concluído" : "Hábito",
        }),
      ),
  ].sort((a, b) => a.time.localeCompare(b.time));
  return {
    date: input.date,
    dateIso: dateInTimeZone(input.date, input.timeZone),
    greetingName: input.greetingName,
    timeZone: input.timeZone,
    timeline,
    priorities: input.priorities,
    habits: input.habits,
    freeToSpendCents: input.freeToSpendCents,
    projectedBalanceCents: input.projectedBalanceCents,
  };
}

export async function getCurrentTodaySnapshot({
  greetingName,
  timeZone,
}: {
  greetingName: string;
  timeZone: string;
}) {
  const now = new Date();
  const today = dateInTimeZone(now, timeZone);
  const [start, end] = localDayWindow(today, timeZone);
  const [occurrences, planning, ledger, habits] = await Promise.all([
    getCalendarOccurrences(start, end),
    getCurrentTasks(),
    getCurrentFinanceLedger(),
    getCurrentTodayHabits(today),
  ]);
  const priorities = planning.tasks
    .filter(
      (task) =>
        task.status !== "completed" &&
        !task.scheduledStart &&
        (task.priority === "high" ||
          task.priority === "medium" ||
          (task.dueAt
            ? dateInTimeZone(new Date(task.dueAt), timeZone) === today
            : false)),
    )
    .map((task) => ({ id: task.id, title: task.title, done: false }));
  const summary = buildMonthlyFinanceSummary(ledger, today);

  return composeTodaySnapshot({
    date: now,
    greetingName,
    timeZone,
    occurrences: occurrences.map((item) => ({
      id: item.id,
      source_id: item.sourceId,
      kind: item.kind,
      title: item.title,
      starts_at: item.start,
      ends_at: item.end,
      all_day: item.allDay,
      location: item.location,
      source: item.source,
      last_synced_at: item.lastSyncedAt,
      estimated_minutes: item.estimatedMinutes,
      parent_event_id: item.parentEventId,
    })),
    priorities,
    habits,
    freeToSpendCents: summary.freePerDayCents ?? 0,
    projectedBalanceCents: summary.projectedEndBalanceCents,
  });
}
