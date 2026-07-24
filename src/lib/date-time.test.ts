import { describe, expect, it } from "vitest";
import { localDateTimeToIso } from "./date-time";

describe("localDateTimeToIso", () => {
  it("rejeita horário local inexistente na mudança para horário de verão", () => {
    expect(
      localDateTimeToIso("2026-03-08T02:30", "America/New_York"),
    ).toBeNull();
  });

  it("escolhe explicitamente a ocorrência mais tardia em horário ambíguo", () => {
    expect(
      localDateTimeToIso("2026-11-01T01:30", "America/New_York"),
    ).toBe("2026-11-01T06:30:00.000Z");
  });
});
