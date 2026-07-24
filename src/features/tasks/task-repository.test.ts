import { describe, expect, it } from "vitest";
import { mapTaskRows } from "./task-repository";

describe("task repository", () => {
  it("mapeia uma única linha para as três visualizações", () => {
    const [task] = mapTaskRows([
      {
        id: "task-1",
        title: "Planejar viagem",
        notes: null,
        status: "planned",
        priority: "high",
        due_at: null,
        scheduled_start: "2026-07-24T12:00:00Z",
        scheduled_end: "2026-07-24T13:00:00Z",
        estimated_minutes: 60,
        project_id: "project-1",
        parent_task_id: null,
        recurrence_rule: null,
        carried_from_task_id: null,
        completed_at: null,
        projects: { name: "Férias" },
      },
    ]);

    expect(task).toEqual(
      expect.objectContaining({
        title: "Planejar viagem",
        projectName: "Férias",
        estimatedMinutes: 60,
      }),
    );
  });
});
