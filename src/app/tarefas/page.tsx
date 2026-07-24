import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/features/identity/identity-repository";
import { TaskDashboard } from "@/features/tasks/task-dashboard";
import { dateInTimeZone } from "@/features/finance/finance-model";
import { getCurrentTasks } from "@/features/tasks/task-repository";
import type { TaskSection, TaskView } from "@/features/tasks/task-model";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ secao?: string; visao?: string }>;
}) {
  const identity = await getCurrentIdentity();
  if (!identity.profile.onboarding_completed) redirect("/onboarding");
  const [{ tasks, projects }, query] = await Promise.all([
    getCurrentTasks(),
    searchParams,
  ]);
  const section = ["inbox", "today", "upcoming", "completed"].includes(
    query.secao ?? "",
  )
    ? (query.secao as TaskSection)
    : "today";
  const view = ["list", "timeline", "kanban"].includes(query.visao ?? "")
    ? (query.visao as TaskView)
    : "list";
  return (
    <TaskDashboard
      projects={projects}
      section={section}
      tasks={tasks}
      today={dateInTimeZone(new Date(), identity.preferences.timezone)}
      timeZone={identity.preferences.timezone}
      view={view}
    />
  );
}
