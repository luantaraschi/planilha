"use client";

import { useActionState, useState } from "react";
import { importStatement, type FinanceActionState } from "./finance-actions";
import { parseBankStatementCsv } from "./finance-model";
import styles from "./finance-dashboard.module.css";

const initialState: FinanceActionState = { status: "idle", message: "" };

type Preview = {
  names: string[];
  rows: number;
  skipped: number;
  error: string;
};

const emptyPreview: Preview = {
  names: [],
  rows: 0,
  skipped: 0,
  error: "",
};

export function StatementImporter() {
  const [state, formAction, pending] = useActionState(
    importStatement,
    initialState,
  );
  const [preview, setPreview] = useState<Preview>(emptyPreview);

  async function previewFile(file?: File) {
    if (!file) {
      setPreview(emptyPreview);
      return;
    }

    try {
      const parsed = parseBankStatementCsv(await file.text());
      setPreview({
        names: parsed.rows.slice(0, 3).map((row) => row.description),
        rows: parsed.rows.length,
        skipped: parsed.skipped,
        error: "",
      });
    } catch (error) {
      setPreview({
        ...emptyPreview,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível ler este arquivo.",
      });
    }
  }

  return (
    <form action={formAction} className={styles.importForm}>
      <label className={styles.fileDrop}>
        <span className={styles.fileIllustration} aria-hidden="true">
          <span />
        </span>
        <span>
          <strong>Escolha o CSV do seu banco</strong>
          <small>Data, descrição e valor · até 1 MB</small>
        </span>
        <input
          accept=".csv,text/csv"
          name="statement"
          onChange={(event) => previewFile(event.target.files?.[0])}
          required
          type="file"
        />
      </label>

      {preview.error ? (
        <p className={styles.importError} role="alert">
          {preview.error}
        </p>
      ) : null}

      {preview.rows > 0 ? (
        <div className={styles.importPreview}>
          <p>
            <strong>{preview.rows} saídas encontradas</strong>
            {preview.skipped > 0
              ? ` · ${preview.skipped} entradas ou linhas ignoradas`
              : ""}
          </p>
          <span>{preview.names.join(" · ")}</span>
        </div>
      ) : null}

      <div className={styles.formFooter}>
        <p
          aria-live="polite"
          className={styles.actionMessage}
          data-status={state.status}
          role={state.message ? "status" : undefined}
        >
          {state.message || "Créditos do extrato não entram como despesa."}
        </p>
        <button
          className={styles.secondaryButton}
          disabled={pending || preview.rows === 0}
          type="submit"
        >
          {pending ? "Importando…" : "Importar lançamentos"}
        </button>
      </div>
    </form>
  );
}
