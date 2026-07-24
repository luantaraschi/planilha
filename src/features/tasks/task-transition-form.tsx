"use client";

import { useActionState } from "react";
import {
  transitionTaskAction,
  type TaskActionState,
} from "./task-actions";
import styles from "./task-dashboard.module.css";

const initialState: TaskActionState = { status: "idle", message: "" };

export function TaskTransitionForm({
  actionName,
  label,
  taskId,
}: {
  actionName: "complete" | "undo" | "postpone" | "tomorrow";
  label: string;
  taskId: string;
}) {
  const [state, action, pending] = useActionState(
    transitionTaskAction,
    initialState,
  );
  return (
    <form action={action}>
      <input name="taskId" type="hidden" value={taskId} />
      <button
        disabled={pending}
        name="action"
        type="submit"
        value={actionName}
      >
        {pending ? "Atualizando…" : label}
      </button>
      <p
        aria-live="polite"
        className={styles.transitionStatus}
        data-status={state.status}
        role="status"
      >
        {state.message}
      </p>
    </form>
  );
}
