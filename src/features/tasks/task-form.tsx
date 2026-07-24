"use client";

import { useActionState } from "react";
import { createTaskAction, type TaskActionState } from "./task-actions";
import type { PlanningProject, PlanningTask } from "./task-model";
import styles from "./task-dashboard.module.css";

const initialState: TaskActionState = { status: "idle", message: "" };

export function TaskForm({
  projects,
  tasks,
  timeZone,
}: {
  projects: PlanningProject[];
  tasks: PlanningTask[];
  timeZone: string;
}) {
  const [state, action, pending] = useActionState(
    createTaskAction,
    initialState,
  );
  return (
    <details className={styles.taskComposer}>
      <summary>Adicionar tarefa</summary>
      <form action={action}>
        <input name="timeZone" type="hidden" value={timeZone} />
        <label className={styles.wideField}>
          Título
          <input maxLength={240} name="title" required />
        </label>
        <label className={styles.wideField}>
          Notas
          <textarea maxLength={10000} name="notes" rows={3} />
        </label>
        <label>
          Estado
          <select defaultValue="inbox" name="status">
            <option value="inbox">Inbox</option>
            <option value="planned">Planejada</option>
          </select>
        </label>
        <label>
          Prioridade
          <select defaultValue="none" name="priority">
            <option value="none">Sem prioridade</option>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </label>
        <label>
          Prazo
          <input name="dueAt" type="datetime-local" />
        </label>
        <label>
          Duração (min)
          <input max={1440} min={1} name="estimatedMinutes" type="number" />
        </label>
        <label>
          Início agendado
          <input name="scheduledStart" type="datetime-local" />
        </label>
        <label>
          Fim agendado
          <input name="scheduledEnd" type="datetime-local" />
        </label>
        <label>
          Projeto
          <select defaultValue="" name="projectId">
            <option value="">Sem projeto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Subtarefa de
          <select defaultValue="" name="parentTaskId">
            <option value="">Tarefa principal</option>
            {tasks
              .filter((task) => task.status !== "completed")
              .map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
          </select>
        </label>
        <label className={styles.wideField}>
          Recorrência (RRULE)
          <input
            name="recurrenceRule"
            placeholder="FREQ=WEEKLY;BYDAY=FR"
          />
        </label>
        <button disabled={pending} type="submit">
          {pending ? "Salvando…" : "Salvar tarefa"}
        </button>
        <p aria-live="polite" data-status={state.status}>
          {state.message}
        </p>
      </form>
    </details>
  );
}
