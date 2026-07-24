import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { TodaySnapshot } from "./today-model";
import { TodayDashboard } from "./today-dashboard";

const snapshot: TodaySnapshot = {
  date: new Date("2026-07-23T12:00:00-03:00"),
  dateIso: "2026-07-23",
  greetingName: "Lu",
  timeZone: "America/Bahia",
  timeline: [
    {
      id: "planning",
      time: "09:00",
      title: "Planejamento da semana",
      kind: "event",
      detail: "Agenda local",
    },
  ],
  priorities: [{ id: "documents", title: "Enviar documentos", done: false }],
  habits: [],
  freeToSpendCents: 14_500,
  projectedBalanceCents: 215_000,
};

describe("TodayDashboard", () => {
  it("shows real navigation and an accessible quick task capture", async () => {
    const user = userEvent.setup();
    render(<TodayDashboard snapshot={snapshot} />);
    const capture = screen.getByRole("textbox", { name: "Captura rápida" });

    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(capture).toHaveFocus();
    expect(screen.getByRole("link", { name: "Agenda" })).toHaveAttribute("href", "/agenda");
    expect(screen.getByRole("link", { name: "Tarefas" })).toHaveAttribute("href", "/tarefas");
    expect(screen.getByRole("link", { name: "Bem-estar" })).toHaveAttribute("href", "/bem-estar");
  });

  it("uses real capture and progress actions instead of local preview controls", () => {
    render(<TodayDashboard snapshot={snapshot} />);

    expect(screen.getByText(/Inbox/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "compromisso" })).toHaveAttribute("href", "/agenda");
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(screen.getByRole("button", { name: /Concluir Enviar documentos/ })).toBeInTheDocument();
  });

  it("teaches the empty state without inventing a routine", () => {
    render(<TodayDashboard snapshot={{ ...snapshot, timeline: [], priorities: [], habits: [] }} />);

    expect(screen.getByText("Seu dia ainda está aberto.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma prioridade sem horário.")).toBeInTheDocument();
  });
});
