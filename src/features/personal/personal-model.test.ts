import { describe, expect, it } from "vitest";
import { normalizeGoal, normalizeMood, normalizeNote } from "./personal-model";

describe("personal form normalization", () => {
  it("keeps personal entries bounded and rejects invalid dates", () => {
    const invalidMood = new FormData();
    invalidMood.set("mood", "good");
    invalidMood.set("occurredOn", "2026-02-29");
    const goal = new FormData();
    goal.set("title", "Ler");
    goal.set("targetOn", "2026-08-01");
    expect(normalizeNote(new FormData())).toMatchObject({ ok: false });
    expect(normalizeMood(invalidMood)).toMatchObject({ ok: false });
    expect(normalizeGoal(goal)).toEqual({
      ok: true,
      value: { title: "Ler", area: "personal", targetOn: "2026-08-01" },
    });
  });
});
