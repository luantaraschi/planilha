export const moods = [
  "terrible",
  "bad",
  "neutral",
  "good",
  "great",
] as const;

export type Mood = (typeof moods)[number];

type Result<T> = { ok: true; value: T } | { ok: false; message: string };

function text(value: FormDataEntryValue | null, limit: number) {
  return String(value ?? "").trim().slice(0, limit);
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function normalizeNote(formData: FormData): Result<{ title: string; body: string }> {
  const title = text(formData.get("title"), 120);
  const body = text(formData.get("body"), 5000);
  if (!body) return { ok: false, message: "Escreva algo antes de salvar a nota." };
  return { ok: true, value: { title, body } };
}

export function normalizeMood(formData: FormData): Result<{ mood: Mood; note: string | null; occurredOn: string }> {
  const mood = String(formData.get("mood") ?? "");
  const note = text(formData.get("note"), 1000) || null;
  const occurredOn = String(formData.get("occurredOn") ?? "");
  if (!moods.includes(mood as Mood)) return { ok: false, message: "Escolha como você está se sentindo." };
  if (!validDate(occurredOn)) return { ok: false, message: "A data do check-in é inválida." };
  return { ok: true, value: { mood: mood as Mood, note, occurredOn } };
}

export function normalizeGoal(formData: FormData): Result<{ title: string; area: string; targetOn: string | null }> {
  const title = text(formData.get("title"), 120);
  const area = String(formData.get("area") ?? "personal");
  const targetOn = String(formData.get("targetOn") ?? "") || null;
  if (!title) return { ok: false, message: "Dê um nome à sua meta." };
  if (!['personal', 'work', 'wellbeing', 'finance', 'home', 'other'].includes(area)) {
    return { ok: false, message: "Escolha uma área válida." };
  }
  if (targetOn && !validDate(targetOn)) return { ok: false, message: "A data da meta é inválida." };
  return { ok: true, value: { title, area, targetOn } };
}
