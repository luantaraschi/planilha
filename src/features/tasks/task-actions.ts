"use server";

import { revalidatePath } from "next/cache";
import { getCurrentIdentity } from "@/features/identity/identity-repository";
import { normalizeTaskInput } from "./task-model";
import {
  addCurrentTask,
  transitionCurrentTask,
} from "./task-repository";

export type TaskActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createTaskAction(
  _state: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const identity = await getCurrentIdentity();
  const input = normalizeTaskInput(formData, identity.preferences.timezone);
  if (!input.ok) return { status: "error", message: input.message };
  if ((await addCurrentTask(input.value)) !== "added") {
    return { status: "error", message: "Não foi possível salvar a tarefa." };
  }
  revalidatePath("/");
  revalidatePath("/tarefas");
  revalidatePath("/agenda");
  return { status: "success", message: "Tarefa salva." };
}

export async function transitionTaskAction(
  _state: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const taskId = String(formData.get("taskId") ?? "");
  const action = String(formData.get("action") ?? "");
  if (
    !uuidPattern.test(taskId) ||
    !["complete", "undo", "postpone", "tomorrow"].includes(action)
  ) {
    return { status: "error", message: "A ação da tarefa é inválida." };
  }
  const result = await transitionCurrentTask(
    taskId,
    action as "complete" | "undo" | "postpone" | "tomorrow",
  );
  if (result !== "updated") {
    return {
      status: "error",
      message: "Não foi possível atualizar a tarefa.",
    };
  }
  revalidatePath("/");
  revalidatePath("/tarefas");
  revalidatePath("/agenda");
  return { status: "success", message: "Tarefa atualizada." };
}
