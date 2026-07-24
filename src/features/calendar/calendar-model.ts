import { localDateTimeToIso } from "@/lib/date-time";

export type CalendarKind = "event" | "task" | "bill" | "trip";
export type CalendarView = "day" | "week" | "month" | "list";

export type CalendarOccurrence = {
  id: string;
  sourceId: string;
  kind: CalendarKind;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  source: string;
  lastSyncedAt: string | null;
  estimatedMinutes: number | null;
  parentEventId: string | null;
};

export type CalendarEventInput = {
  title: string;
  eventType: "event" | "bill" | "trip";
  location: string | null;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  recurrenceRule: string | null;
  tripStartsOn: string | null;
  tripEndsOn: string | null;
  parentEventId: string | null;
  timeZone: string;
};

export function dayKey(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).formatToParts(new Date(value));
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export function groupOccurrencesByDay(
  occurrences: CalendarOccurrence[],
  timeZone: string,
) {
  const groups = new Map<string, CalendarOccurrence[]>();
  for (const occurrence of occurrences) {
    const key = dayKey(occurrence.start, timeZone);
    groups.set(key, [...(groups.get(key) ?? []), occurrence]);
  }
  if (groups.size === 1) {
    const key = groups.keys().next().value as string;
    groups.set(key, occurrences);
  }
  return groups;
}

export function detectScheduleIssues(occurrences: CalendarOccurrence[]) {
  const timed = occurrences
    .filter((item) => !item.allDay)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const overlaps: Array<[string, string]> = [];
  for (let first = 0; first < timed.length; first += 1) {
    for (let second = first + 1; second < timed.length; second += 1) {
      if (Date.parse(timed[second].start) >= Date.parse(timed[first].end)) break;
      overlaps.push([timed[first].id, timed[second].id]);
    }
  }
  const workloadMinutes = timed.reduce(
    (total, item) =>
      total +
      (item.estimatedMinutes ??
        Math.max(0, (Date.parse(item.end) - Date.parse(item.start)) / 60_000)),
    0,
  );
  return {
    overlaps,
    workloadMinutes,
    overloaded: workloadMinutes > 8 * 60,
    canSave: true,
  };
}

export function normalizeCalendarEvent(
  formData: FormData,
):
  | { ok: true; value: CalendarEventInput }
  | { ok: false; message: string } {
  const title = String(formData.get("title") ?? "").trim();
  const eventType = String(formData.get("eventType") ?? "");
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  const recurrenceRule =
    String(formData.get("recurrenceRule") ?? "").trim().toUpperCase() || null;
  const tripStartsOn = String(formData.get("tripStartsOn") ?? "") || null;
  const tripEndsOn = String(formData.get("tripEndsOn") ?? "") || null;
  const parentEventId = String(formData.get("parentEventId") ?? "") || null;
  const timeZone = String(formData.get("timeZone") ?? "America/Bahia");
  if (!title || title.length > 240) {
    return { ok: false, message: "Informe um título de até 240 caracteres." };
  }
  if (!["event", "bill", "trip"].includes(eventType)) {
    return { ok: false, message: "Escolha um tipo de compromisso." };
  }
  if (
    !startsAt ||
    !endsAt ||
    !Number.isFinite(Date.parse(startsAt)) ||
    Date.parse(endsAt) <= Date.parse(startsAt)
  ) {
    return { ok: false, message: "O fim deve vir depois do início." };
  }
  if (
    recurrenceRule &&
    !/^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(;[A-Z]+=[A-Z0-9,+-]+)*$/.test(
      recurrenceRule,
    )
  ) {
    return { ok: false, message: "Use uma recorrência iCalendar válida." };
  }
  if (
    eventType === "trip" &&
    (!tripStartsOn || !tripEndsOn || tripEndsOn < tripStartsOn)
  ) {
    return { ok: false, message: "Informe o intervalo da viagem." };
  }
  let normalizedStart: string | null;
  let normalizedEnd: string | null;
  try {
    normalizedStart = localDateTimeToIso(startsAt, timeZone);
    normalizedEnd = localDateTimeToIso(endsAt, timeZone);
  } catch {
    return { ok: false, message: "O fuso horário do perfil é inválido." };
  }
  if (!normalizedStart || !normalizedEnd) {
    return { ok: false, message: "Informe datas válidas." };
  }
  return {
    ok: true,
    value: {
      title,
      eventType: eventType as CalendarEventInput["eventType"],
      location: String(formData.get("location") ?? "").trim() || null,
      startsAt: normalizedStart,
      endsAt: normalizedEnd,
      allDay: formData.get("allDay") === "on",
      recurrenceRule,
      tripStartsOn: eventType === "trip" ? tripStartsOn : null,
      tripEndsOn: eventType === "trip" ? tripEndsOn : null,
      parentEventId,
      timeZone,
    },
  };
}
