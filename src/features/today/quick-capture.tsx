"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { GardenIcon } from "@/components/garden-icon";
import { createTaskAction, type TaskActionState } from "@/features/tasks/task-actions";
import styles from "./today-dashboard.module.css";

const initialState: TaskActionState = { status: "idle", message: "" };

export function QuickCapture({
  dateLabel,
  greeting,
}: {
  dateLabel: string;
  greeting: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(createTaskAction, initialState);

  useEffect(() => {
    if (state.status === "success") inputRef.current?.form?.reset();
  }, [state.status]);

  return (
    <form action={action}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.dateLabel}>{dateLabel}</p>
          <h1>{greeting}</h1>
          <p className={styles.subtitle}>Tudo o que merece sua atenção, com calma.</p>
          <button
            className={styles.primaryAction}
            onClick={() => inputRef.current?.focus()}
            type="button"
          >
            Adicionar
          </button>
        </div>
        <Image
          alt=""
          className={styles.morningIllustration}
          height={800}
          loading="eager"
          src="/illustrations/morning-garden.webp"
          width={1200}
        />
      </header>

      <label className={styles.capture} htmlFor="quick-capture">
        <GardenIcon name="tasks" size={25} />
        <span className="sr-only">Captura rápida</span>
        <input
          id="quick-capture"
          maxLength={240}
          name="title"
          placeholder="Capture uma tarefa em uma frase…"
          ref={inputRef}
          required
          type="text"
        />
        <span aria-hidden="true" className={styles.captureHint}>Enter</span>
      </label>
      <input name="status" type="hidden" value="inbox" />
      <input name="priority" type="hidden" value="none" />
      <p className={styles.previewNotice} role="status">
        {state.message || "A tarefa é salva no seu Inbox. Para outro tipo de registro:"} {state.message ? null : <><Link href="/agenda">compromisso</Link>, <Link href="/notas">nota</Link> ou <Link href="/financas">gasto</Link>.</>}
      </p>
      <button className="sr-only" disabled={pending} type="submit">Salvar tarefa</button>
    </form>
  );
}
