import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import type { CalendarOccurrence } from "./calendar-model";

const trip: CalendarOccurrence = {
  id: "trip",
  sourceId: "trip",
  kind: "trip",
  title: "Chapada",
  start: "2026-07-24T12:00:00Z",
  end: "2026-07-27T12:00:00Z",
  allDay: false,
  location: null,
  source: "local",
  lastSyncedAt: null,
  estimatedMinutes: null,
  parentEventId: null,
};

describe("calendar views", () => {
  it("renderiza os sete dias mesmo em uma semana vazia", () => {
    render(
      <WeekView
        date="2026-07-19"
        occurrences={[]}
        timeZone="America/Bahia"
      />,
    );
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(7);
  });

  it("repete uma viagem em cada dia tocado pelo intervalo", () => {
    render(
      <MonthView
        date="2026-07-24"
        occurrences={[trip]}
        timeZone="America/Bahia"
      />,
    );
    expect(screen.getAllByText("Chapada")).toHaveLength(4);
  });
});
