import { describe, expect, it, vi } from "vitest";
import type { FinanceWorkspace } from "@/features/finance/finance-model";
import { requestOpenAiFinanceAnswer } from "./openai-finance";

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
    expenseCents: 180_000,
    resultCents: 320_000,
    projectedEndBalanceCents: 320_000,
    freePerDayCents: null,
    confidence: "partial",
    missingInputs: ["Defina um orçamento."],
    budgetRemainingCents: null,
    forecastIncomeCents: 0,
    forecastExpenseCents: 0,
  },
};

describe("requestOpenAiFinanceAnswer", () => {
  it("sends the deterministic cents summary to the Responses API", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: "O resultado do mês está positivo.",
                },
              ],
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(
      requestOpenAiFinanceAnswer(
        {
          apiKey: "sk-test",
          model: "gpt-5.6-luna",
          instructions: "Responda de forma simples.",
          question: "Como está o resultado?",
          workspace,
        },
        fetcher,
      ),
    ).resolves.toBe("O resultado do mês está positivo.");

    const request = fetcher.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body));
    expect(body.input).toContain('"incomeCents":500000');
    expect(body.input).toContain('"confidence":"partial"');
  });
});
