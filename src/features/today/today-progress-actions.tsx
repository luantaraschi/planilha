"use client";

import { useActionState } from "react";
import { GardenIcon } from "@/components/garden-icon";
import {
  transitionTaskAction,
  type TaskActionState,
} from "@/features/tasks/task-actions";
import {
  setHabitStatusAction,
  type HabitActionState,
} from "@/features/habits/habit-actions";
import styles from "./today-dashboard.module.css";

const initialTaskState: TaskActionState = { status: "idle", message: "" };
const initialHabitState: HabitActionState = { status: "idle", message: "" };

export function PriorityProgressAction({
  done,
  taskId,
  title,
}: {
  done: boolean;
  taskId: string;
  title: string;
}) {
  const [state, action, pending] = useActionState(
    transitionTaskAction,
    initialTaskState,
  );

  return (
    <form action={action} className={styles.progressForm}>
      <input name="taskId" type="hidden" value={taskId} />
      <button
        aria-label={done ? `Reabrir ${title}` : `Concluir ${title}`}
        className={styles.progressButton}
        disabled={pending}
        name="action"
        type="submit"
        value={done ? "undo" : "complete"}
      >
        <GardenIcon name={done ? "today" : "tasks"} size={17} />
        <span>{done ? "Reabrir" : "Concluir"}</span>
      </button>
      <span aria-live="polite" className="sr-only" role="status">
        {state.message}
      </span>
    </form>
  );
}

export function HabitProgressAction({
  done,
  habitId,
  occurredOn,
  title,
}: {
  done: boolean;
  habitId: string;
  occurredOn: string;
  title: string;
}) {
  const [state, action, pending] = useActionState(
    setHabitStatusAction,
    initialHabitState,
  );

  return (
    <form action={action} className={styles.progressForm}>
      <input name="habitId" type="hidden" value={habitId} />
      <input name="occurredOn" type="hidden" value={occurredOn} />
      <input name="status" type="hidden" value={done ? "skipped" : "completed"} />
      <button
        aria-label={done ? `Desfazer ${title}` : `Marcar ${title} como feito`}
        className={styles.progressButton}
        disabled={pending}
        type="submit"
      >
        <GardenIcon name={done ? "today" : "wellbeing"} size={17} />
        <span>{done ? "Desfazer" : "Feito"}</span>
      </button>
      <span aria-live="polite" className="sr-only" role="status">
        {state.message}
      </span>
    </form>
  );
}
