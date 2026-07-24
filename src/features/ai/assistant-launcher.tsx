"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { GardenIcon } from "@/components/garden-icon";
import { askFinanceAssistant, type FinanceAssistantResult } from "./finance-assistant-actions";
import styles from "./assistant-launcher.module.css";

type Message = { id: number; author: "assistant" | "user"; text: string };

export function AssistantLauncher() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nextMessageId = useRef(2);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ id: 1, author: "assistant", text: "Oi! Posso ajudar a entender seu mês financeiro e decidir o próximo passo." }]);

  useEffect(() => {
    function openFromNavigation() {
      if (window.location.hash === "#assistente" && !dialogRef.current?.open) {
        dialogRef.current?.showModal();
      }
    }

    openFromNavigation();
    window.addEventListener("hashchange", openFromNavigation);
    return () => window.removeEventListener("hashchange", openFromNavigation);
  }, []);

  async function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    const id = nextMessageId.current;
    nextMessageId.current += 2;
    setMessages((current) => [...current, { id, author: "user", text: trimmed }]);
    setQuestion("");
    setPending(true);
    try {
      const result: FinanceAssistantResult = await askFinanceAssistant(trimmed);
      setMessages((current) => [...current, { id: id + 1, author: "assistant", text: result.answer }]);
      setNotice(result.notice);
    } catch {
      setMessages((current) => [...current, { id: id + 1, author: "assistant", text: "Não consegui responder agora. Tente de novo em instantes." }]);
    } finally { setPending(false); }
  }

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void ask(question); }

  return <><button aria-controls="assistant-dialog" aria-label="Abrir assistente" className={styles.launcher} id="assistente" onClick={() => dialogRef.current?.showModal()} type="button"><GardenIcon name="assistant" size={27} /><span>Assistente</span></button><dialog aria-labelledby="assistant-title" className={styles.dialog} id="assistant-dialog" ref={dialogRef}><div className={styles.dialogHeader}><div><p>Assistente Organiza</p><h2 id="assistant-title">Uma conversa de cada vez.</h2></div><button aria-label="Fechar assistente" onClick={() => dialogRef.current?.close()} type="button">×</button></div><div aria-live="polite" className={styles.messages}>{messages.map((message) => <p data-author={message.author} key={message.id}>{message.text}</p>)}{pending ? <p data-author="assistant">Pensando com cuidado…</p> : null}</div><div className={styles.suggestions}>{["Como está meu mês?", "Quanto está livre por dia?", "Qual o saldo projetado?"].map((item) => <button disabled={pending} key={item} onClick={() => void ask(item)} type="button">{item}</button>)}</div><form className={styles.form} onSubmit={submit}><label className="sr-only" htmlFor="assistant-question">Pergunte sobre suas finanças</label><input autoComplete="off" disabled={pending} id="assistant-question" onChange={(event) => setQuestion(event.target.value)} placeholder="Pergunte sobre suas finanças…" value={question} /><button aria-label="Enviar pergunta" disabled={pending} type="submit">↗</button></form>{notice ? <p className={styles.notice} role="status">{notice}</p> : <p className={styles.notice}>Você controla o que registra e o que configura para a IA.</p>}</dialog></>;
}
