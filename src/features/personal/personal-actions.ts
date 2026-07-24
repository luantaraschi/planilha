"use server";

import { revalidatePath } from "next/cache";
import { normalizeGoal, normalizeMood, normalizeNote } from "./personal-model";
import { addCurrentGoal, addCurrentNote, saveCurrentMood, toggleCurrentGoal } from "./personal-repository";

export type PersonalActionState = { status: "idle" | "success" | "error"; message: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function refresh(...paths: string[]) { paths.forEach((path) => revalidatePath(path)); }

export async function createNoteAction(_: PersonalActionState, formData: FormData): Promise<PersonalActionState> {
  const input = normalizeNote(formData);
  if (!input.ok) return { status: "error", message: input.message };
  if (!(await addCurrentNote(input.value))) return { status: "error", message: "Não foi possível salvar a nota." };
  refresh("/", "/notas");
  return { status: "success", message: "Nota salva." };
}

export async function saveMoodAction(_: PersonalActionState, formData: FormData): Promise<PersonalActionState> {
  const input = normalizeMood(formData);
  if (!input.ok) return { status: "error", message: input.message };
  if (!(await saveCurrentMood(input.value))) return { status: "error", message: "Não foi possível registrar seu check-in." };
  refresh("/", "/bem-estar");
  return { status: "success", message: "Check-in registrado." };
}

export async function createGoalAction(_: PersonalActionState, formData: FormData): Promise<PersonalActionState> {
  const input = normalizeGoal(formData);
  if (!input.ok) return { status: "error", message: input.message };
  if (!(await addCurrentGoal(input.value))) return { status: "error", message: "Não foi possível salvar a meta." };
  refresh("/", "/metas");
  return { status: "success", message: "Meta criada." };
}

export async function toggleGoalAction(_: PersonalActionState, formData: FormData): Promise<PersonalActionState> {
  const id = String(formData.get("goalId") ?? "");
  if (!uuid.test(id)) return { status: "error", message: "Meta inválida." };
  if (!(await toggleCurrentGoal(id, String(formData.get("completed")) === "true"))) return { status: "error", message: "Não foi possível atualizar a meta." };
  refresh("/", "/metas");
  return { status: "success", message: "Meta atualizada." };
}
