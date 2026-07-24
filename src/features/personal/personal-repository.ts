import { getVerifiedUserId } from "@/features/identity/identity-repository";
import { createClient } from "@/lib/supabase/server";
import type { Mood } from "./personal-model";

export type PersonalNote = { id: string; title: string; body: string; pinned: boolean; updatedAt: string };
export type PersonalGoal = { id: string; title: string; area: string; targetOn: string | null; completed: boolean };
export type MoodEntry = { id: string; mood: Mood; note: string | null; occurredOn: string };

async function currentUser() {
  const supabase = await createClient();
  return { supabase, userId: await getVerifiedUserId(supabase) };
}

export async function getCurrentNotes() {
  const { supabase, userId } = await currentUser();
  const { data, error } = await supabase.from("notes").select("id, title, body, pinned, updated_at").eq("user_id", userId).order("pinned", { ascending: false }).order("updated_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar suas notas.");
  return (data ?? []).map((note): PersonalNote => ({ id: note.id, title: note.title, body: note.body, pinned: note.pinned, updatedAt: note.updated_at }));
}

export async function getCurrentGoals() {
  const { supabase, userId } = await currentUser();
  const { data, error } = await supabase.from("personal_goals").select("id, title, area, target_on, completed").eq("user_id", userId).order("completed").order("target_on", { nullsFirst: false });
  if (error) throw new Error("Não foi possível carregar suas metas.");
  return (data ?? []).map((goal): PersonalGoal => ({ id: goal.id, title: goal.title, area: goal.area, targetOn: goal.target_on, completed: goal.completed }));
}

export async function getRecentMoodEntries() {
  const { supabase, userId } = await currentUser();
  const { data, error } = await supabase.from("mood_entries").select("id, mood, note, occurred_on").eq("user_id", userId).order("occurred_on", { ascending: false }).limit(31);
  if (error) throw new Error("Não foi possível carregar seus check-ins.");
  return (data ?? []).map((entry): MoodEntry => ({ id: entry.id, mood: entry.mood as Mood, note: entry.note, occurredOn: entry.occurred_on }));
}

export async function addCurrentNote(input: { title: string; body: string }) {
  const { supabase, userId } = await currentUser();
  const { error } = await supabase.from("notes").insert({ user_id: userId, title: input.title, body: input.body });
  return !error;
}

export async function saveCurrentMood(input: { mood: Mood; note: string | null; occurredOn: string }) {
  const { supabase, userId } = await currentUser();
  const { error } = await supabase.from("mood_entries").upsert({ user_id: userId, mood: input.mood, note: input.note, occurred_on: input.occurredOn }, { onConflict: "user_id,occurred_on" });
  return !error;
}

export async function addCurrentGoal(input: { title: string; area: string; targetOn: string | null }) {
  const { supabase, userId } = await currentUser();
  const { error } = await supabase.from("personal_goals").insert({ user_id: userId, title: input.title, area: input.area, target_on: input.targetOn });
  return !error;
}

export async function toggleCurrentGoal(id: string, completed: boolean) {
  const { supabase, userId } = await currentUser();
  const { error } = await supabase.from("personal_goals").update({ completed }).eq("user_id", userId).eq("id", id);
  return !error;
}
