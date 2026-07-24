import { getVerifiedUserId } from "@/features/identity/identity-repository";
import { createClient } from "@/lib/supabase/server";
import type {
  PlanningProject,
  PlanningTask,
  TaskInput,
} from "./task-model";

const taskFields =
  "id, title, notes, status, priority, due_at, scheduled_start, scheduled_end, estimated_minutes, project_id, parent_task_id, recurrence_rule, carried_from_task_id, completed_at, projects(name)";

type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  estimated_minutes: number | null;
  project_id: string | null;
  parent_task_id: string | null;
  recurrence_rule: string | null;
  carried_from_task_id: string | null;
  completed_at: string | null;
  projects: { name: string } | Array<{ name: string }> | null;
};

function relationName(value: TaskRow["projects"]) {
  return Array.isArray(value) ? value[0]?.name ?? null : value?.name ?? null;
}

export function mapTaskRows(rows: TaskRow[]): PlanningTask[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    notes: row.notes,
    status: row.status as PlanningTask["status"],
    priority: row.priority as PlanningTask["priority"],
    dueAt: row.due_at,
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end,
    estimatedMinutes: row.estimated_minutes,
    projectId: row.project_id,
    projectName: relationName(row.projects),
    parentTaskId: row.parent_task_id,
    recurrenceRule: row.recurrence_rule,
    carriedFromTaskId: row.carried_from_task_id,
    completedAt: row.completed_at,
  }));
}

export async function getCurrentTasks(): Promise<{
  tasks: PlanningTask[];
  projects: PlanningProject[];
}> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const [taskResult, projectResult] = await Promise.all([
    supabase
      .from("tasks")
      .select(taskFields)
      .eq("user_id", userId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name, color, status")
      .eq("user_id", userId)
      .neq("status", "archived")
      .order("name"),
  ]);
  if (taskResult.error || projectResult.error) {
    throw new Error("Não foi possível carregar suas tarefas.");
  }
  return {
    tasks: mapTaskRows((taskResult.data ?? []) as unknown as TaskRow[]),
    projects: (projectResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      status: row.status as PlanningProject["status"],
    })),
  };
}

export async function addCurrentTask(input: TaskInput) {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    title: input.title,
    notes: input.notes,
    status: input.status,
    priority: input.priority,
    due_at: input.dueAt,
    scheduled_start: input.scheduledStart,
    scheduled_end: input.scheduledEnd,
    estimated_minutes: input.estimatedMinutes,
    project_id: input.projectId,
    parent_task_id: input.parentTaskId,
    recurrence_rule: input.recurrenceRule,
  });
  return error ? ("error" as const) : ("added" as const);
}

export async function transitionCurrentTask(
  taskId: string,
  action: "complete" | "undo" | "postpone" | "tomorrow",
) {
  const supabase = await createClient();
  await getVerifiedUserId(supabase);
  const { error } = await supabase.rpc("transition_task", {
    task_id_input: taskId,
    action_input: action,
  });
  return error ? ("error" as const) : ("updated" as const);
}
