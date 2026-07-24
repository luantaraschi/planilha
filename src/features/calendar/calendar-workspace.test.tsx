import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CalendarWorkspace } from "./calendar-workspace";

describe("CalendarWorkspace", () => {
  it("mostra quatro visões, tipos distintos, detalhe e roteiro de viagem", () => {
    render(
      <CalendarWorkspace
        date="2026-07-24"
        timeZone="America/Bahia"
        occurrences={[
          {
            id: "trip",
            sourceId: "trip",
            kind: "trip",
            title: "Fim de semana em Lençóis",
            start: "2026-07-24T09:00:00-03:00",
            end: "2026-07-26T18:00:00-03:00",
            allDay: false,
            location: "Chapada Diamantina",
            source: "local",
            lastSyncedAt: null,
            estimatedMinutes: null,
            parentEventId: null,
          },
          {
            id: "stop",
            sourceId: "stop",
            kind: "event",
            title: "Poço Azul",
            start: "2026-07-25T10:00:00-03:00",
            end: "2026-07-25T12:00:00-03:00",
            allDay: false,
            location: "Nova Redenção",
            source: "local",
            lastSyncedAt: null,
            estimatedMinutes: null,
            parentEventId: "trip",
          },
        ]}
      />,
    );

    for (const name of ["Dia", "Semana", "Mês", "Lista"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
    expect(screen.getAllByText("Viagem").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Detalhes do dia" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Roteiro" })).toBeInTheDocument();
    expect(screen.getAllByText("Poço Azul")).toHaveLength(2);
  });
});
