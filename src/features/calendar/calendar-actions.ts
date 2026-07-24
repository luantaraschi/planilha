"use server";

import { revalidatePath } from "next/cache";
import { normalizeCalendarEvent } from "./calendar-model";
import { addCurrentEvent } from "./calendar-repository";

export type CalendarActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function createCalendarEvent(
  _state: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  const input = normalizeCalendarEvent(formData);
  if (!input.ok) return { status: "error", message: input.message };
  if ((await addCurrentEvent(input.value)) !== "added") {
    return { status: "error", message: "Não foi possível salvar na agenda." };
  }
  revalidatePath("/");
  revalidatePath("/agenda");
  return {
    status: "success",
    message: input.value.parentEventId
      ? "Item adicionado ao roteiro."
      : "Compromisso salvo.",
  };
}
