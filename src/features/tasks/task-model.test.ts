import { describe, expect, it } from "vitest";
import {
  buildTaskWorkspace,
  normalizeTaskInput,
  taskSection,
  type PlanningTask,
} from "./task-model";

const task = (overrides: Partial<PlanningTask> = {}): PlanningTask => ({
  id: "10000000-0000-4000-8000-000000000001",
  title: "Preparar apresentação",
  notes: "Revisar os números",
  status: "planned",
  priority: "high",
  dueAt: "2026-07-24T18:00:00-03:00",
  scheduledStart: null,
  scheduledEnd: null,
  estimatedMinutes: 45,
  projectId: null,
  projectName: null,
  parentTaskId: null,
  recurrenceRule: null,
  carriedFromTaskId: null,
  completedAt: null,
  ...overrides,
});

describe("task model", () => {
  it("classifica Inbox, Hoje, Próximas e Concluídas sem duplicar tarefas", () => {
    expect(taskSection(task({ status: "inbox" }), "2026-07-24")).toBe("inbox");
    expect(taskSection(task(), "2026-07-24")).toBe("today");
    expect(
      taskSection(task({ dueAt: "2026-07-27T09:00:00-03:00" }), "2026-07-24"),
    ).toBe("upcoming");
    expect(
      taskSection(task({ status: "completed", completedAt: "2026-07-24T10:00:00Z" }), "2026-07-24"),
    ).toBe("completed");

    const workspace = buildTaskWorkspace([task()], [], "2026-07-24");
    expect(workspace.list).toHaveLength(1);
    expect(workspace.timeline[0]).toBe(workspace.list[0]);
    expect(workspace.kanban.high[0]).toBe(workspace.list[0]);
  });

  it("normaliza prioridade, notas, duração, recorrência, subtarefa e projeto", () => {
    const form = new FormData();
    form.set("title", "  Fazer revisão  ");
    form.set("notes", "Anotar decisões");
    form.set("priority", "medium");
    form.set("estimatedMinutes", "30");
    form.set("recurrenceRule", "FREQ=WEEKLY;BYDAY=FR");
    form.set("projectId", "20000000-0000-4000-8000-000000000002");
    form.set("parentTaskId", "30000000-0000-4000-8000-000000000003");

    expect(normalizeTaskInput(form)).toEqual({
      ok: true,
      value: expect.objectContaining({
        title: "Fazer revisão",
        priority: "medium",
        estimatedMinutes: 30,
        recurrenceRule: "FREQ=WEEKLY;BYDAY=FR",
        projectId: "20000000-0000-4000-8000-000000000002",
        parentTaskId: "30000000-0000-4000-8000-000000000003",
      }),
    });
  });

  it("rejeita RRULE não compatível com iCalendar", () => {
    const form = new FormData();
    form.set("title", "Rotina");
    form.set("priority", "none");
    form.set("recurrenceRule", "toda sexta");
    expect(normalizeTaskInput(form)).toEqual({
      ok: false,
      message: "Use uma recorrência iCalendar iniciada por FREQ=.",
    });
  });

  it("persiste prazos locais no fuso do perfil", () => {
    const form = new FormData();
    form.set("title", "Enviar proposta");
    form.set("priority", "high");
    form.set("dueAt", "2026-07-24T09:00");
    form.set("timeZone", "America/Bahia");

    expect(normalizeTaskInput(form)).toEqual({
      ok: true,
      value: expect.objectContaining({
        dueAt: "2026-07-24T12:00:00.000Z",
      }),
    });
  });
});
