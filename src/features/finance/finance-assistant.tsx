"use client";

import { FormEvent, useRef, useState } from "react";
import { GardenIcon } from "@/components/garden-icon";
import {
  askFinanceAssistant,
  type FinanceAssistantResult,
} from "@/features/ai/finance-assistant-actions";
import {
  answerFinanceQuestion,
  type FinanceWorkspace,
} from "./finance-model";
import styles from "./finance-dashboard.module.css";

type Message = {
  id: number;
  author: "assistant" | "user";
  text: string;
};

const suggestions = [
  "Como está o resultado do mês?",
  "Qual é o saldo projetado?",
  "Quanto está livre por dia?",
];

export function FinanceAssistant({
  workspace,
}: {
  workspace: FinanceWorkspace;
}) {
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [assistantMode, setAssistantMode] =
    useState<FinanceAssistantResult["mode"]>("local");
  const [notice, setNotice] = useState("");
  const nextMessageId = useRef(2);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      author: "assistant",
      text:
        workspace.summary.incomeCents > 0 ||
        workspace.summary.expenseCents > 0
          ? "Já li seus lançamentos deste mês. O que você quer entender?"
          : "Adicione um lançamento ou importe um extrato e eu ajudo a interpretar.",
    },
  ]);

  async function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    const userMessageId = nextMessageId.current;
    nextMessageId.current += 1;
    setMessages((current) => [
      ...current,
      { id: userMessageId, author: "user", text: trimmed },
    ]);
    setQuestion("");
    setPending(true);
    setNotice("");

    let result: FinanceAssistantResult;
    try {
      result = await askFinanceAssistant(trimmed);
    } catch {
      result = {
        answer: answerFinanceQuestion(trimmed, workspace),
        mode: "local",
        notice: "A conexão falhou; usei a análise local.",
      };
    }

    const assistantMessageId = nextMessageId.current;
    nextMessageId.current += 1;
    setMessages((current) => [
      ...current,
      { id: assistantMessageId, author: "assistant", text: result.answer },
    ]);
    setAssistantMode(result.mode);
    setNotice(result.notice);
    setPending(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <section
      aria-labelledby="assistant-title"
      className={styles.assistant}
      id="assistente"
    >
      <header className={styles.assistantHeader}>
        <span aria-hidden="true" className={styles.assistantMark}>
          <GardenIcon name="assistant" size={25} />
        </span>
        <div>
          <p>Leitura assistida</p>
          <h2 id="assistant-title">Conversa financeira</h2>
        </div>
      </header>

      <div aria-live="polite" className={styles.messages}>
        {messages.map((message) => (
          <p
            className={styles.message}
            data-author={message.author}
            key={message.id}
          >
            {message.text}
          </p>
        ))}
        {pending ? (
          <p className={styles.message} data-author="assistant">
            Pensando com cuidado…
          </p>
        ) : null}
      </div>

      {notice ? (
        <p className={styles.assistantAlert} role="status">
          {notice}
        </p>
      ) : null}

      <div aria-label="Perguntas sugeridas" className={styles.suggestions}>
        {suggestions.map((suggestion) => (
          <button
            disabled={pending}
            key={suggestion}
            onClick={() => void ask(suggestion)}
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form className={styles.chatForm} onSubmit={submit}>
        <label className={styles.srOnly} htmlFor="finance-question">
          Pergunte sobre suas finanças
        </label>
        <input
          autoComplete="off"
          disabled={pending}
          id="finance-question"
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Pergunte sobre seu mês…"
          value={question}
        />
        <button
          aria-label="Enviar pergunta"
          disabled={pending}
          type="submit"
        >
          <span aria-hidden="true">↗</span>
        </button>
      </form>
      <p className={styles.assistantNote}>
        {assistantMode === "online"
          ? "IA configurada · resposta gerada com seus dados deste mês."
          : "Modo local · análises privadas sem custo de API."}
      </p>
    </section>
  );
}
