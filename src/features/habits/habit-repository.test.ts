import { describe, expect, it } from "vitest";
import { mergeTodayHabits } from "./habit-repository";

describe("habit repository", () => {
  it("mescla hábitos ativos e logs reais do dia", () => {
    expect(
      mergeTodayHabits(
        [{ id: "h1", title: "Alongar", scheduled_time: "07:30:00" }],
        [{ habit_id: "h1", status: "completed" }],
      ),
    ).toEqual([
      { id: "h1", title: "Alongar", time: "07:30", done: true },
    ]);
  });
});
