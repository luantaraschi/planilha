import type { FinanceWorkspace } from "@/features/finance/finance-model";

type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

type OpenAiFinanceRequest = {
  apiKey: string;
  model: string;
  instructions: string;
  question: string;
  workspace: FinanceWorkspace;
};

function financeContext(workspace: FinanceWorkspace) {
  return {
    summary: workspace.summary,
    selectedAccountId: workspace.selectedAccountId,
    accounts: workspace.accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.accountType,
    })),
    transactions: workspace.transactions.slice(0, 100).map((transaction) => ({
      type: transaction.transactionType,
      description: transaction.description,
      category: transaction.categoryName,
      amountCents: transaction.amountCents,
      date: transaction.occurredOn,
      status: transaction.status,
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
        "Use somente os valores em centavos e a confiança fornecidos, não invente precisão, " +
        "e trate sugestões como educação financeira, não aconselhamento profissional." +
        customInstructions,
      input:
        `Dados financeiros: ${JSON.stringify(financeContext(request.workspace))}\n\n` +
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
