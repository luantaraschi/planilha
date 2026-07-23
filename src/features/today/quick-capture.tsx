"use client";

import { useRef } from "react";
import { GardenIcon } from "@/components/garden-icon";
import styles from "./today-dashboard.module.css";

export function QuickCapture({
  dateLabel,
  greeting,
}: {
  dateLabel: string;
  greeting: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.dateLabel}>{dateLabel}</p>
          <h1>{greeting}</h1>
          <p className={styles.subtitle}>
            Tudo o que merece sua atenção, com calma.
          </p>
        </div>
        <button
          className={styles.primaryAction}
          onClick={() => inputRef.current?.focus()}
          type="button"
        >
          Adicionar
        </button>
      </header>

      <label className={styles.capture} htmlFor="quick-capture">
        <GardenIcon name="assistant" size={25} />
        <span className="sr-only">Captura rápida</span>
        <input
          aria-label="Captura rápida"
          id="quick-capture"
          placeholder="Registre uma tarefa, gasto, nota ou compromisso…"
          ref={inputRef}
          type="text"
        />
        <span aria-hidden="true" className={styles.captureHint}>
          escrever
        </span>
      </label>
    </>
  );
}
