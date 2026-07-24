import { describe, expect, it } from "vitest";
import {
  detectScheduleIssues,
  groupOccurrencesByDay,
  normalizeCalendarEvent,
  type CalendarOccurrence,
} from "./calendar-model";

const occurrence = (
  id: string,
  start: string,
  end: string,
  estimatedMinutes = 60,
): CalendarOccurrence => ({
  id,
  sourceId: id,
  kind: "task",
  title: id,
  start,
  end,
  allDay: false,
  location: null,
  source: "local",
  lastSyncedAt: null,
  estimatedMinutes,
  parentEventId: null,
});

describe("calendar model", () => {
  it("usa as mesmas ocorrências nas visões diária, semanal, mensal e lista", () => {
    const items = [occurrence("a", "2026-07-24T09:00:00Z", "2026-07-24T10:00:00Z")];
    const grouped = groupOccurrencesByDay(items, "America/Bahia");
    expect(grouped.get("2026-07-24")).toBe(items);
  });

  it("sinaliza sobreposição e carga alta sem bloquear o salvamento", () => {
    const issues = detectScheduleIssues([
      occurrence("a", "2026-07-24T09:00:00Z", "2026-07-24T13:00:00Z", 240),
      occurrence("b", "2026-07-24T12:00:00Z", "2026-07-24T17:00:00Z", 300),
    ]);
    expect(issues.overlaps).toEqual([["a", "b"]]);
    expect(issues.workloadMinutes).toBe(540);
    expect(issues.canSave).toBe(true);
  });

  it("converte horário local no fuso escolhido antes de persistir", () => {
    const form = new FormData();
    form.set("title", "Consulta");
    form.set("eventType", "event");
    form.set("startsAt", "2026-07-24T09:00");
    form.set("endsAt", "2026-07-24T10:00");
    form.set("timeZone", "America/Bahia");

    expect(normalizeCalendarEvent(form)).toEqual({
      ok: true,
      value: expect.objectContaining({
        startsAt: "2026-07-24T12:00:00.000Z",
        endsAt: "2026-07-24T13:00:00.000Z",
        timeZone: "America/Bahia",
      }),
    });
  });
});
