import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatLongDate,
} from "./today-model";

describe("today model", () => {
  it("formata centavos inteiros como reais", () => {
    expect(formatCurrency(14_500)).toBe("R$ 145,00");
  });

  it("formata a data de referência em português", () => {
    expect(formatLongDate(new Date("2026-07-23T12:00:00-03:00"))).toBe(
      "quinta-feira, 23 de julho",
    );
  });
});
