"use server";

import { revalidatePath } from "next/cache";
import { addCurrentHabit, setCurrentHabitStatus } from "./habit-repository";

export type HabitActionState = { status: "idle" | "success" | "error"; message: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function refresh() { revalidatePath("/"); revalidatePath("/bem-estar"); }

export async function createHabitAction(_: HabitActionState, formData: FormData): Promise<HabitActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const scheduledTime = String(formData.get("scheduledTime") ?? "");
  if (!title || title.length > 120 || !/^\d{2}:\d{2}$/.test(scheduledTime)) {
    return { status: "error", message: "Informe um hábito e um horário válidos." };
  }
  if (!(await addCurrentHabit(title, scheduledTime))) return { status: "error", message: "Não foi possível salvar o hábito." };
  refresh();
  return { status: "success", message: "Hábito criado." };
}

export async function setHabitStatusAction(_: HabitActionState, formData: FormData): Promise<HabitActionState> {
  const habitId = String(formData.get("habitId") ?? "");
  const occurredOn = String(formData.get("occurredOn") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!uuid.test(habitId) || !/^\d{4}-\d{2}-\d{2}$/.test(occurredOn) || !["completed", "skipped"].includes(status)) {
    return { status: "error", message: "Não foi possível atualizar o hábito." };
  }
  if (!(await setCurrentHabitStatus(habitId, occurredOn, status as "completed" | "skipped"))) return { status: "error", message: "Não foi possível atualizar o hábito." };
  refresh();
  return { status: "success", message: "Hábito atualizado." };
}
