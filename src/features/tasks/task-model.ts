import { localDateTimeToIso } from "@/lib/date-time";
import { isSupportedRecurrenceRule } from "@/lib/recurrence";

export type TaskStatus = "inbox" | "planned" | "completed" | "cancelled";
export type TaskPriority = "none" | "low" | "medium" | "high";
export type TaskSection = "inbox" | "today" | "upcoming" | "completed";
export type TaskView = "list" | "timeline" | "kanban";

export type PlanningTask = {
  id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  estimatedMinutes: number | null;
  projectId: string | null;
  projectName: string | null;
  parentTaskId: string | null;
  recurrenceRule: string | null;
  carriedFromTaskId: string | null;
  completedAt: string | null;
};

export type PlanningProject = {
  id: string;
  name: string;
  color: string;
  status: "active" | "paused" | "completed" | "archived";
};

export type TaskInput = Omit<
  PlanningTask,
  "id" | "projectName" | "carriedFromTaskId" | "completedAt"
> & { timeZone: string };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function localDate(value: string | null, timeZone: string) {
  if (!value) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).formatToParts(new Date(value));
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export function taskSection(
  task: PlanningTask,
  today: string,
  timeZone = "UTC",
): TaskSection {
  if (task.status === "completed") return "completed";
  if (task.status === "inbox") return "inbox";
  const date = localDate(task.scheduledStart ?? task.dueAt, timeZone);
  return !date || date <= today ? "today" : "upcoming";
}

const priorityOrder: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

export function buildTaskWorkspace(
  tasks: PlanningTask[],
  projects: PlanningProject[],
  today: string,
  timeZone = "UTC",
) {
  const list = [...tasks].sort(
    (a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      (a.scheduledStart ?? a.dueAt ?? "9999").localeCompare(
        b.scheduledStart ?? b.dueAt ?? "9999",
      ),
  );
  return {
    projects,
    list,
    timeline: list,
    kanban: {
      high: list.filter((task) => task.priority === "high"),
      medium: list.filter((task) => task.priority === "medium"),
      low: list.filter((task) => task.priority === "low"),
      none: list.filter((task) => task.priority === "none"),
    },
    sections: Object.fromEntries(
      (["inbox", "today", "upcoming", "completed"] as const).map((section) => [
        section,
        list.filter((task) => taskSection(task, today, timeZone) === section),
      ]),
    ) as Record<TaskSection, PlanningTask[]>,
  };
}

function nullableUuid(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "");
  return value && uuidPattern.test(value) ? value : null;
}

export function normalizeTaskInput(
  formData: FormData,
  timeZone: string,
): { ok: true; value: TaskInput } | { ok: false; message: string } {
  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const priority = String(formData.get("priority") ?? "none");
  const status = String(formData.get("status") ?? "inbox");
  const dueAt = String(formData.get("dueAt") ?? "") || null;
  const scheduledStart =
    String(formData.get("scheduledStart") ?? "") || null;
  const scheduledEnd = String(formData.get("scheduledEnd") ?? "") || null;
  const minutes = String(formData.get("estimatedMinutes") ?? "");
  const estimatedMinutes = minutes ? Number(minutes) : null;
  const recurrenceRule =
    String(formData.get("recurrenceRule") ?? "").trim().toUpperCase() || null;

  if (!title || title.length > 240) {
    return { ok: false, message: "Informe um título de até 240 caracteres." };
  }
  if (notes && notes.length > 10_000) {
    return { ok: false, message: "As notas podem ter até 10.000 caracteres." };
  }
  if (!["none", "low", "medium", "high"].includes(priority)) {
    return { ok: false, message: "Escolha uma prioridade válida." };
  }
  if (!["inbox", "planned"].includes(status)) {
    return { ok: false, message: "Escolha um estado válido." };
  }
  if (
    estimatedMinutes !== null &&
    (!Number.isInteger(estimatedMinutes) ||
      estimatedMinutes < 1 ||
      estimatedMinutes > 1440)
  ) {
    return { ok: false, message: "A duração deve ficar entre 1 e 1440 minutos." };
  }
  if (recurrenceRule && !isSupportedRecurrenceRule(recurrenceRule)) {
    return {
      ok: false,
      message: "Use uma recorrência iCalendar iniciada por FREQ=.",
    };
  }
  if (
    (scheduledStart && !scheduledEnd) ||
    (!scheduledStart && scheduledEnd) ||
    (scheduledStart &&
      scheduledEnd &&
      Date.parse(scheduledEnd) <= Date.parse(scheduledStart))
  ) {
    return { ok: false, message: "O fim agendado deve vir depois do início." };
  }
  let normalizedDueAt: string | null = null;
  let normalizedScheduledStart: string | null = null;
  let normalizedScheduledEnd: string | null = null;
  try {
    normalizedDueAt = dueAt ? localDateTimeToIso(dueAt, timeZone) : null;
    normalizedScheduledStart = scheduledStart
      ? localDateTimeToIso(scheduledStart, timeZone)
      : null;
    normalizedScheduledEnd = scheduledEnd
      ? localDateTimeToIso(scheduledEnd, timeZone)
      : null;
  } catch {
    return { ok: false, message: "O fuso horário do perfil é inválido." };
  }
  if (
    (dueAt && !normalizedDueAt) ||
    (scheduledStart && !normalizedScheduledStart) ||
    (scheduledEnd && !normalizedScheduledEnd)
  ) {
    return { ok: false, message: "Informe datas válidas." };
  }

  return {
    ok: true,
    value: {
      title,
      notes,
      status: status as TaskStatus,
      priority: priority as TaskPriority,
      dueAt: normalizedDueAt,
      scheduledStart: normalizedScheduledStart,
      scheduledEnd: normalizedScheduledEnd,
      estimatedMinutes,
      projectId: nullableUuid(formData, "projectId"),
      parentTaskId: nullableUuid(formData, "parentTaskId"),
      recurrenceRule,
      timeZone,
    },
  };
}

export function recurrenceLabel(rule: string | null) {
  if (!rule) return null;
  if (rule.startsWith("FREQ=DAILY")) return "Diária";
  if (rule.startsWith("FREQ=WEEKLY")) return "Semanal";
  if (rule.startsWith("FREQ=MONTHLY")) return "Mensal";
  return "Anual";
}
