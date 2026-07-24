import type { FinanceSnapshot } from "@/features/finance/finance-model";

type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

type OpenAiFinanceRequest = {
  apiKey: string;
  model: string;
  instructions: string;
  question: string;
  snapshot: FinanceSnapshot;
};

function financeContext(snapshot: FinanceSnapshot) {
  return {
    fixedTotal: snapshot.fixedTotal,
    variableTotal: snapshot.variableTotal,
    monthTotal: snapshot.monthTotal,
    topCategory: snapshot.topCategory,
    topCategoryTotal: snapshot.topCategoryTotal,
    expenses: snapshot.visibleExpenses.slice(0, 100).map((expense) => ({
      type: expense.expenseType,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      date: expense.expenseDate,
    })),
  };
}

function responseText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";

  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) return [];
      return content.flatMap((part) => {
        if (
          part &&
          typeof part === "object" &&
          (part as { type?: unknown }).type === "output_text" &&
          typeof (part as { text?: unknown }).text === "string"
        ) {
          return [(part as { text: string }).text];
        }
        return [];
      });
    })
    .join("\n")
    .trim();
}

export async function requestOpenAiFinanceAnswer(
  request: OpenAiFinanceRequest,
  fetcher: Fetcher = fetch,
) {
  const customInstructions = request.instructions
    ? ` Preferências da pessoa: ${request.instructions}`
    : "";
  const response = await fetcher("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${request.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: request.model,
      instructions:
        "Você é um assistente financeiro pessoal em português do Brasil. " +
        "Use apenas os dados fornecidos, seja claro e acolhedor, não invente valores " +
        "e trate sugestões como educação financeira, não como aconselhamento profissional." +
        customInstructions,
      input:
        `Dados financeiros: ${JSON.stringify(financeContext(request.snapshot))}\n\n` +
        `Pergunta: ${request.question}`,
      max_output_tokens: 450,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error("O provedor de IA não respondeu.");
  }

  const text = responseText(await response.json());
  if (!text) throw new Error("O provedor de IA não respondeu.");
  return text;
}
