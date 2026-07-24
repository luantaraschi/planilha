"use server";

import {
  answerFinanceQuestion,
  buildFinanceWorkspace,
  dateInTimeZone,
} from "@/features/finance/finance-model";
import { getCurrentFinanceLedger } from "@/features/finance/finance-repository";
import { getCurrentIdentity } from "@/features/identity/identity-repository";
import { getCurrentAiRuntimeSettings } from "./ai-settings-repository";
import { requestOpenAiFinanceAnswer } from "./openai-finance";

export type FinanceAssistantResult = {
  answer: string;
  mode: "local" | "online";
  notice: string;
};

export async function askFinanceAssistant(
  question: string,
): Promise<FinanceAssistantResult> {
  const normalizedQuestion = question.trim();
  if (!normalizedQuestion || normalizedQuestion.length > 500) {
    return {
      answer: "Escreva uma pergunta de até 500 caracteres.",
      mode: "local",
      notice: "",
    };
  }

  const [ledger, identity] = await Promise.all([
    getCurrentFinanceLedger(),
    getCurrentIdentity(),
  ]);
  const workspace = buildFinanceWorkspace(
    ledger,
    dateInTimeZone(new Date(), identity.preferences.timezone),
  );
  const localAnswer = answerFinanceQuestion(normalizedQuestion, workspace);

  let settings;
  try {
    settings = await getCurrentAiRuntimeSettings();
  } catch {
    return {
      answer: localAnswer,
      mode: "local",
      notice: "Não consegui abrir o cofre; usei a análise local.",
    };
  }

  if (!settings) {
    return { answer: localAnswer, mode: "local", notice: "" };
  }

  try {
    return {
      answer: await requestOpenAiFinanceAnswer({
        ...settings,
        question: normalizedQuestion,
        workspace,
      }),
      mode: "online",
      notice: "",
    };
  } catch {
    return {
      answer: localAnswer,
      mode: "local",
      notice: "A IA online não respondeu; usei a análise local.",
    };
  }
}
