import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { GardenIcon } from "@/components/garden-icon";
import { TaskForm } from "./task-form";
import { TaskTransitionForm } from "./task-transition-form";
import {
  buildTaskWorkspace,
  recurrenceLabel,
  type PlanningProject,
  type PlanningTask,
  type TaskSection,
  type TaskView,
} from "./task-model";
import styles from "./task-dashboard.module.css";

const sectionLabels: Record<TaskSection, string> = {
  inbox: "Inbox",
  today: "Hoje",
  upcoming: "Próximas",
  completed: "Concluídas",
};
const priorityLabels = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
  none: "Sem prioridade",
};

function TaskActions({ task }: { task: PlanningTask }) {
  const actions =
    task.status === "completed"
      ? ([["undo", "Desfazer"]] as const)
      : ([
          ["complete", "Concluir"],
          ["postpone", "Adiar 1 dia"],
          ["tomorrow", "Mover para amanhã"],
        ] as const);
  return (
    <div className={styles.taskActions}>
      {actions.map(([action, label]) => (
        <TaskTransitionForm
          actionName={action}
          key={action}
          label={label}
          taskId={task.id}
        />
      ))}
    </div>
  );
}

function TaskRow({
  task,
  timeZone,
}: {
  task: PlanningTask;
  timeZone: string;
}) {
  const recurrence = recurrenceLabel(task.recurrenceRule);
  const when = task.scheduledStart ?? task.dueAt;
  return (
    <li
      className={styles.taskRow}
      data-completed={task.status === "completed"}
      data-priority={task.priority}
      data-subtask={Boolean(task.parentTaskId)}
    >
      <span aria-hidden="true" className={styles.checkMark}>
        {task.status === "completed" ? "✓" : ""}
      </span>
      <div className={styles.taskCopy}>
        <strong>{task.title}</strong>
        {task.notes ? <p>{task.notes}</p> : null}
        <div className={styles.taskMeta}>
          {task.projectName ? <span>{task.projectName}</span> : null}
          {task.estimatedMinutes ? <span>{task.estimatedMinutes} min</span> : null}
          {recurrence ? <span>{recurrence}</span> : null}
          {when ? (
            <time dateTime={when}>
              {new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                timeZone,
              }).format(new Date(when))}
            </time>
          ) : null}
        </div>
      </div>
      <TaskActions task={task} />
    </li>
  );
}

function TaskCollection({
  tasks,
  timeZone,
  view,
}: {
  tasks: PlanningTask[];
  timeZone: string;
  view: TaskView;
}) {
  if (!tasks.length) {
    return (
      <div className={styles.emptyTasks}>
        <GardenIcon name="tasks" size={42} />
        <strong>Este recorte está livre.</strong>
        <span>Adicione uma tarefa ou escolha outra aba.</span>
      </div>
    );
  }
  if (view === "kanban") {
    return (
      <div className={styles.kanban}>
        {(["high", "medium", "low", "none"] as const).map((priority) => (
          <section aria-label={`Prioridade ${priorityLabels[priority]}`} key={priority}>
            <h2>{priorityLabels[priority]}</h2>
            <ul>
              {tasks
                .filter((task) => task.priority === priority)
                .map((task) => (
                  <TaskRow key={task.id} task={task} timeZone={timeZone} />
                ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }
  return (
    <ol className={view === "timeline" ? styles.taskTimeline : styles.taskList}>
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} timeZone={timeZone} />
      ))}
    </ol>
  );
}

export function TaskDashboard({
  projects,
  section = "today",
  tasks,
  today,
  timeZone,
  view = "list",
}: {
  projects: PlanningProject[];
  section?: TaskSection;
  tasks: PlanningTask[];
  today: string;
  timeZone: string;
  view?: TaskView;
}) {
  const workspace = buildTaskWorkspace(tasks, projects, today, timeZone);
  const selected = workspace.sections[section];
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#tarefas-principais">Pular para o conteúdo</a>
      <AppSidebar active="tasks" />
      <main className={styles.main} id="tarefas-principais">
        <header className={styles.header}>
          <div>
            <p>Seu caderno de próximos passos</p>
            <h1>Tarefas</h1>
            <span>{selected.length} neste recorte</span>
          </div>
          <span aria-hidden="true" className={styles.notebookArt}>
            <GardenIcon name="tasks" size={54} />
            <i />
          </span>
        </header>

        <nav aria-label="Seções de tarefas" className={styles.sectionTabs}>
          {(Object.keys(sectionLabels) as TaskSection[]).map((key) => (
            <Link
              aria-label={sectionLabels[key]}
              aria-current={section === key ? "page" : undefined}
              href={`/tarefas?secao=${key}&visao=${view}`}
              key={key}
            >
              {sectionLabels[key]}
              <span>{workspace.sections[key].length}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.viewBar}>
          <div>
            <strong>{sectionLabels[section]}</strong>
            <span>Uma tarefa, três jeitos de enxergar.</span>
          </div>
          <nav aria-label="Visualização">
            {([
              ["list", "Lista"],
              ["timeline", "Linha do tempo"],
              ["kanban", "Kanban"],
            ] as const).map(([key, label]) => (
              <Link
                aria-current={view === key ? "page" : undefined}
                href={`/tarefas?secao=${section}&visao=${key}`}
                key={key}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <TaskCollection tasks={selected} timeZone={timeZone} view={view} />
        <TaskForm projects={projects} tasks={tasks} />
      </main>
    </div>
  );
}
