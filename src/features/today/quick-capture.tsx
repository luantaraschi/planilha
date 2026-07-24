"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { GardenIcon } from "@/components/garden-icon";
import styles from "./today-dashboard.module.css";

const INITIAL_PREVIEW_NOTICE =
  "Prévia navegável: as alterações ficam apenas nesta tela.";
const DRAFT_KEY = "quick-capture-draft";

export function QuickCapture({
  dateLabel,
  greeting,
}: {
  dateLabel: string;
  greeting: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (localStorage.getItem(DRAFT_KEY) ?? ""),
  );
  const [feedback, setFeedback] = useState(INITIAL_PREVIEW_NOTICE);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedDraft = draft.trim();

    if (!trimmedDraft) {
      inputRef.current?.focus();
      return;
    }

    setFeedback(`“${trimmedDraft}” foi adicionado só nesta prévia.`);
    setDraft("");
    localStorage.removeItem(DRAFT_KEY);
  }

  return (
    <form onSubmit={handleSubmit}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.dateLabel}>{dateLabel}</p>
          <h1>{greeting}</h1>
          <p className={styles.subtitle}>
            Tudo o que merece sua atenção, com calma.
          </p>
        </div>
        <Image
          alt=""
          className={styles.morningIllustration}
          height={800}
          loading="eager"
          src="/illustrations/morning-garden.webp"
          width={1200}
        />
        <button className={styles.primaryAction} type="submit">
          Adicionar
        </button>
      </header>

      <label className={styles.capture} htmlFor="quick-capture">
        <GardenIcon name="assistant" size={25} />
        <span className="sr-only">Captura rápida</span>
        <input
          aria-describedby="preview-notice"
          id="quick-capture"
          onChange={(event) => {
            const value = event.target.value;
            setDraft(value);
            if (value) {
              localStorage.setItem(DRAFT_KEY, value);
            } else {
              localStorage.removeItem(DRAFT_KEY);
            }
          }}
          placeholder="Registre uma tarefa, gasto, nota ou compromisso…"
          ref={inputRef}
          type="text"
          value={draft}
        />
        <span aria-hidden="true" className={styles.captureHint}>
          Enter
        </span>
      </label>
      <p
        className={styles.previewNotice}
        id="preview-notice"
        role="status"
      >
        {feedback}
      </p>
    </form>
  );
}
