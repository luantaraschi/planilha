import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentAiRuntimeSettings: vi.fn(),
  getCurrentFinanceLedger: vi.fn(),
  getCurrentIdentity: vi.fn(),
  requestOpenAiFinanceAnswer: vi.fn(),
}));

vi.mock("./ai-settings-repository", () => ({
  getCurrentAiRuntimeSettings: mocks.getCurrentAiRuntimeSettings,
}));
vi.mock("@/features/finance/finance-repository", () => ({
  getCurrentFinanceLedger: mocks.getCurrentFinanceLedger,
}));
vi.mock("@/features/identity/identity-repository", () => ({
  getCurrentIdentity: mocks.getCurrentIdentity,
}));
vi.mock("./openai-finance", () => ({
  requestOpenAiFinanceAnswer: mocks.requestOpenAiFinanceAnswer,
}));

import { askFinanceAssistant } from "./finance-assistant-actions";

describe("askFinanceAssistant", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getCurrentIdentity.mockResolvedValue({
      preferences: { timezone: "Asia/Tokyo" },
    });
    mocks.getCurrentFinanceLedger.mockResolvedValue({
      accounts: [
        {
          id: "account-1",
          name: "Conta principal",
          accountType: "checking",
          openingBalanceCents: 100_000,
          active: true,
        },
      ],
      categories: [],
      transactions: [
        {
          id: "income-1",
          accountId: "account-1",
          transactionType: "income",
          description: "Salário",
          categoryId: null,
          categoryName: null,
          amountCents: 500_000,
          occurredOn: "2026-07-01",
          dueOn: null,
          status: "cleared",
          transferAccountId: null,
          source: "manual",
        },
      ],
      recurringEntries: [],
      budgets: [],
      goals: [],
    });
  });

  it("uses the configured online agent with the ledger workspace", async () => {
    mocks.getCurrentAiRuntimeSettings.mockResolvedValue({
      apiKey: "sk-secret",
      model: "gpt-5.6-luna",
      instructions: "Seja breve.",
    });
    mocks.requestOpenAiFinanceAnswer.mockResolvedValue(
      "O resultado do mês está positivo.",
    );

    await expect(
      askFinanceAssistant("Como está o resultado?"),
    ).resolves.toEqual({
      answer: "O resultado do mês está positivo.",
      mode: "online",
      notice: "",
    });
    expect(mocks.requestOpenAiFinanceAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "sk-secret",
        question: "Como está o resultado?",
        workspace: expect.objectContaining({
          summary: expect.objectContaining({ incomeCents: 500_000 }),
        }),
      }),
    );
  });

  it("falls back to deterministic local analysis without a key", async () => {
    mocks.getCurrentAiRuntimeSettings.mockResolvedValue(null);

    const result = await askFinanceAssistant("Resumo do mês");

    expect(result.mode).toBe("local");
    expect(result.answer).toContain("entraram");
    expect(mocks.requestOpenAiFinanceAnswer).not.toHaveBeenCalled();
  });

  it("builds the month using the profile timezone", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T01:00:00Z"));
    mocks.getCurrentIdentity.mockResolvedValue({
      preferences: { timezone: "Asia/Tokyo" },
    });
    mocks.getCurrentAiRuntimeSettings.mockResolvedValue({
      apiKey: "sk-secret",
      model: "gpt-5.6-luna",
      instructions: "",
    });
    mocks.requestOpenAiFinanceAnswer.mockResolvedValue("Resumo.");

    await askFinanceAssistant("Resumo");

    expect(mocks.requestOpenAiFinanceAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: expect.objectContaining({
          summary: expect.objectContaining({ incomeCents: 500_000 }),
        }),
      }),
    );
  });
});
