import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transition: vi.fn(),
}));

vi.mock("./task-repository", () => ({
  addCurrentTask: vi.fn(),
  transitionCurrentTask: mocks.transition,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { transitionTaskAction } from "./task-actions";

describe("transitionTaskAction", () => {
  beforeEach(() => mocks.transition.mockReset());

  it("devolve erro acessível quando a transição falha", async () => {
    mocks.transition.mockResolvedValue("error");
    const form = new FormData();
    form.set("taskId", "11111111-1111-4111-8111-111111111111");
    form.set("action", "complete");

    await expect(
      transitionTaskAction({ status: "idle", message: "" }, form),
    ).resolves.toEqual({
      status: "error",
      message: "Não foi possível atualizar a tarefa.",
    });
  });
});
