import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { FinanceSnapshot } from "./finance-model";
import { FinanceAssistant } from "./finance-assistant";

const snapshot: FinanceSnapshot = {
  fixedTotal: 2_400,
  variableTotal: 600,
  monthTotal: 3_000,
  topCategory: "Moradia",
  topCategoryTotal: 1_800,
  visibleExpenses: [],
};

describe("FinanceAssistant", () => {
  it("responde perguntas usando o panorama financeiro atual", async () => {
    const user = userEvent.setup();
    render(<FinanceAssistant snapshot={snapshot} />);

    await user.type(
      screen.getByRole("textbox", { name: "Pergunte sobre suas finanças" }),
      "Quanto gasto com despesas fixas?",
    );
    await user.click(screen.getByRole("button", { name: "Enviar pergunta" }));

    expect(
      screen.getByText(/Seus gastos fixos somam R\$\s2\.400,00/),
    ).toBeInTheDocument();
  });
});
