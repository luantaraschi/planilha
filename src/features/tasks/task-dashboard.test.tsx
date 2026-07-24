import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskDashboard } from "./task-dashboard";

describe("TaskDashboard", () => {
  it("oferece seções e visualizações sobre a mesma coleção", () => {
    render(
      <TaskDashboard
        projects={[{ id: "p1", name: "Casa", color: "#A73655", status: "active" }]}
        timeZone="America/Bahia"
        today="2026-07-24"
        tasks={[{
          id: "t1",
          title: "Comprar tinta",
          notes: "Levar a amostra",
          status: "planned",
          priority: "high",
          dueAt: "2026-07-24T17:00:00-03:00",
          scheduledStart: null,
          scheduledEnd: null,
          estimatedMinutes: 30,
          projectId: "p1",
          projectName: "Casa",
          parentTaskId: null,
          recurrenceRule: "FREQ=WEEKLY",
          carriedFromTaskId: null,
          completedAt: null,
        }]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Tarefas" })).toBeInTheDocument();
    const sections = within(
      screen.getByRole("navigation", { name: "Seções de tarefas" }),
    );
    expect(sections.getByRole("link", { name: "Inbox" })).toBeInTheDocument();
    expect(sections.getByRole("link", { name: "Hoje" })).toBeInTheDocument();
    expect(sections.getByRole("link", { name: "Próximas" })).toBeInTheDocument();
    expect(sections.getByRole("link", { name: "Concluídas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lista" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Linha do tempo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kanban" })).toBeInTheDocument();
    expect(screen.getAllByText("Casa")).toHaveLength(2);
    expect(screen.getByText("30 min")).toBeInTheDocument();
    expect(screen.getByText("Semanal")).toBeInTheDocument();
  });
});
