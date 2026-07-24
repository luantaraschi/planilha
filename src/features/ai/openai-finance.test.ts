import { describe, expect, it, vi } from "vitest";
import type { FinanceSnapshot } from "@/features/finance/finance-model";
import { requestOpenAiFinanceAnswer } from "./openai-finance";

const snapshot: FinanceSnapshot = {
  fixedTotal: 1800,
  variableTotal: 320,
  monthTotal: 2120,
  topCategory: "Moradia",
  topCategoryTotal: 1800,
  visibleExpenses: [],
};

describe("requestOpenAiFinanceAnswer", () => {
  it("calls the Responses API and extracts raw output text", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: "Moradia merece sua atenção primeiro.",
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
          question: "Onde posso economizar?",
          snapshot,
        },
        fetcher,
      ),
    ).resolves.toBe("Moradia merece sua atenção primeiro.");

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test",
        }),
      }),
    );
    const request = fetcher.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({
      model: "gpt-5.6-luna",
      instructions: expect.stringContaining("Responda de forma simples."),
      input: expect.stringContaining("Onde posso economizar?"),
    });
  });

  it("returns a private error when the provider rejects the request", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response('{"error":{"message":"invalid key"}}', { status: 401 }),
    );

    await expect(
      requestOpenAiFinanceAnswer(
        {
          apiKey: "sk-invalid",
          model: "gpt-5.6-luna",
          instructions: "",
          question: "Resumo",
          snapshot,
        },
        fetcher,
      ),
    ).rejects.toThrow("O provedor de IA não respondeu.");
  });
});
