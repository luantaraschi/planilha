"use client";

import { FormEvent, useState } from "react";
import { GardenIcon } from "@/components/garden-icon";
import {
  answerFinanceQuestion,
  type FinanceSnapshot,
} from "./finance-model";
import styles from "./finance-dashboard.module.css";

type Message = {
  id: number;
  author: "assistant" | "user";
  text: string;
};

const suggestions = [
  "Quanto gasto com despesas fixas?",
  "Qual categoria pesa mais?",
  "Onde posso economizar?",
];

export function FinanceAssistant({
  snapshot,
}: {
  snapshot: FinanceSnapshot;
}) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      author: "assistant",
      text:
        snapshot.monthTotal > 0
          ? "Já li seus lançamentos deste mês. O que você quer entender?"
          : "Adicione uma despesa ou importe um extrato e eu ajudo a interpretar.",
    },
  ]);

  function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const nextId = messages.length + 1;
    setMessages((current) => [
      ...current,
      { id: nextId, author: "user", text: trimmed },
      {
        id: nextId + 1,
        author: "assistant",
        text: answerFinanceQuestion(trimmed, snapshot),
      },
    ]);
    setQuestion("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(question);
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
          <p className={styles.kicker}>Seu copiloto</p>
          <h2 id="assistant-title">Conversa financeira</h2>
        </div>
      </header>

      <div aria-live="polite" className={styles.messages}>
        {messages.map((message) => (
          <p className={styles.message} data-author={message.author} key={message.id}>
            {message.text}
          </p>
        ))}
      </div>

      <div aria-label="Perguntas sugeridas" className={styles.suggestions}>
        {suggestions.map((suggestion) => (
          <button key={suggestion} onClick={() => ask(suggestion)} type="button">
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
          id="finance-question"
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Pergunte sobre seus gastos…"
          value={question}
        />
        <button aria-label="Enviar pergunta" type="submit">
          <span aria-hidden="true">↗</span>
        </button>
      </form>
      <p className={styles.assistantNote}>
        Respostas privadas, calculadas a partir dos seus lançamentos.
      </p>
    </section>
  );
}
