"use server";

import {
  answerFinanceQuestion,
  buildFinanceWorkspace,
} from "@/features/finance/finance-model";
import { getCurrentFinanceLedger } from "@/features/finance/finance-repository";
import { getCurrentAiRuntimeSettings } from "./ai-settings-repository";
import { requestOpenAiFinanceAnswer } from "./openai-finance";

export type FinanceAssistantResult = {
  answer: string;
  mode: "local" | "online";
  notice: string;
};

function todayInProductTimeZone() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Bahia",
  }).formatToParts(new Date());
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

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

  const workspace = buildFinanceWorkspace(
    await getCurrentFinanceLedger(),
    todayInProductTimeZone(),
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
