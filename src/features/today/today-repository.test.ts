import { describe, expect, it } from "vitest";
import { composeTodaySnapshot } from "./today-repository";

describe("today repository", () => {
  it("mescla agenda, tarefas e contas em ordem e separa prioridades sem horário", () => {
    const snapshot = composeTodaySnapshot({
      date: new Date("2026-07-24T12:00:00-03:00"),
      greetingName: "Luan",
      occurrences: [
        { id: "bill", source_id: "bill", kind: "bill", title: "Internet", starts_at: "2026-07-24T17:00:00-03:00", ends_at: "2026-07-24T17:30:00-03:00", all_day: false, location: null, source: "local", last_synced_at: null, estimated_minutes: null, parent_event_id: null },
        { id: "event", source_id: "event", kind: "event", title: "Reunião", starts_at: "2026-07-24T09:00:00-03:00", ends_at: "2026-07-24T10:00:00-03:00", all_day: false, location: "Sala 2", source: "google", last_synced_at: "2026-07-24T08:00:00-03:00", estimated_minutes: null, parent_event_id: null },
      ],
      priorities: [{ id: "task", title: "Responder proposta", done: false }],
      habits: [{ id: "water", title: "Beber água", done: false, time: "07:00" }],
      freeToSpendCents: 0,
      projectedBalanceCents: 0,
    });

    expect(snapshot.timeline.map((item) => item.title)).toEqual(["Beber água", "Reunião", "Internet"]);
    expect(snapshot.timeline[1].detail).toContain("Google Agenda");
    expect(snapshot.timeline[1].detail).toContain("08:00");
    expect(snapshot.priorities).toEqual([{ id: "task", title: "Responder proposta", done: false }]);
  });
});
