import { describe, expect, it } from "vitest";
import { formatCurrency, formatLongDate, TODAY_DEMO } from "./today-model";

describe("today model", () => {
  it("formata centavos inteiros como reais", () => {
    expect(formatCurrency(14_500)).toBe("R$ 145,00");
  });

  it("formata a data de referência em português", () => {
    expect(formatLongDate(TODAY_DEMO.date)).toBe(
      "quinta-feira, 23 de julho",
    );
  });

  it("mantém o panorama de demonstração consistente", () => {
    expect(TODAY_DEMO.timeline).toHaveLength(4);
    expect(TODAY_DEMO.freeToSpendCents).toBeGreaterThan(0);
    expect(TODAY_DEMO.priorities.filter((item) => item.done)).toHaveLength(1);
  });
});
