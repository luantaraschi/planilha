import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FinanceWorkspace } from "./finance-model";

const mocks = vi.hoisted(() => ({
  askFinanceAssistant: vi.fn(),
}));

vi.mock("@/features/ai/finance-assistant-actions", () => ({
  askFinanceAssistant: mocks.askFinanceAssistant,
}));

import { FinanceAssistant } from "./finance-assistant";

const workspace: FinanceWorkspace = {
  accounts: [],
  categories: [],
  transactions: [],
  recurringEntries: [],
  budgets: [],
  goals: [],
  selectedAccountId: null,
  summary: {
    incomeCents: 500_000,
    expenseCents: 300_000,
    resultCents: 200_000,
    projectedEndBalanceCents: 200_000,
    freePerDayCents: null,
    confidence: "partial",
    missingInputs: [],
    budgetRemainingCents: null,
    forecastIncomeCents: 0,
    forecastExpenseCents: 0,
  },
};

describe("FinanceAssistant", () => {
  it("responde perguntas usando o panorama financeiro atual", async () => {
    mocks.askFinanceAssistant.mockResolvedValue({
      answer:
        "Seus gastos fixos somam R$ 2.400,00 e representam 80% das despesas do mês.",
      mode: "online",
      notice: "",
    });
    const user = userEvent.setup();
    render(<FinanceAssistant workspace={workspace} />);

    await user.type(
      screen.getByRole("textbox", { name: "Pergunte sobre suas finanças" }),
      "Quanto gasto com despesas fixas?",
    );
    await user.click(screen.getByRole("button", { name: "Enviar pergunta" }));

    expect(
      await screen.findByText(/Seus gastos fixos somam R\$\s2\.400,00/),
    ).toBeInTheDocument();
    expect(screen.getByText(/IA configurada/)).toBeInTheDocument();
  });
});
