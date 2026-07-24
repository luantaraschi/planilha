import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentAiRuntimeSettings: vi.fn(),
  listCurrentExpenses: vi.fn(),
  requestOpenAiFinanceAnswer: vi.fn(),
}));

vi.mock("./ai-settings-repository", () => ({
  getCurrentAiRuntimeSettings: mocks.getCurrentAiRuntimeSettings,
}));
vi.mock("@/features/finance/finance-repository", () => ({
  listCurrentExpenses: mocks.listCurrentExpenses,
}));
vi.mock("./openai-finance", () => ({
  requestOpenAiFinanceAnswer: mocks.requestOpenAiFinanceAnswer,
}));

import { askFinanceAssistant } from "./finance-assistant-actions";

describe("askFinanceAssistant", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.listCurrentExpenses.mockResolvedValue([
      {
        id: "expense-1",
        expenseType: "fixed",
        description: "Aluguel",
        category: "Moradia",
        amount: 1800,
        expenseDate: "2026-07-01",
        dueDay: 5,
        source: "manual",
        active: true,
      },
    ]);
  });

  it("uses the configured online agent", async () => {
    mocks.getCurrentAiRuntimeSettings.mockResolvedValue({
      apiKey: "sk-secret",
      model: "gpt-5.6-luna",
      instructions: "Seja breve.",
    });
    mocks.requestOpenAiFinanceAnswer.mockResolvedValue(
      "Os gastos fixos merecem atenção.",
    );

    await expect(
      askFinanceAssistant("Onde posso economizar?"),
    ).resolves.toEqual({
      answer: "Os gastos fixos merecem atenção.",
      mode: "online",
      notice: "",
    });
    expect(mocks.requestOpenAiFinanceAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "sk-secret",
        question: "Onde posso economizar?",
      }),
    );
  });

  it("falls back to the free local analysis without a configured key", async () => {
    mocks.getCurrentAiRuntimeSettings.mockResolvedValue(null);

    const result = await askFinanceAssistant(
      "Quanto gasto com despesas fixas?",
    );

    expect(result.mode).toBe("local");
    expect(result.answer).toContain("gastos fixos somam");
    expect(mocks.requestOpenAiFinanceAnswer).not.toHaveBeenCalled();
  });

  it("keeps working locally when the provider fails", async () => {
    mocks.getCurrentAiRuntimeSettings.mockResolvedValue({
      apiKey: "sk-secret",
      model: "gpt-5.6-luna",
      instructions: "",
    });
    mocks.requestOpenAiFinanceAnswer.mockRejectedValue(new Error("offline"));

    await expect(
      askFinanceAssistant("Resumo do mês"),
    ).resolves.toMatchObject({
      mode: "local",
      notice: "A IA online não respondeu; usei a análise local.",
    });
  });
});
