"use client";

import { useActionState, useState } from "react";
import { importStatement, type FinanceActionState } from "./finance-actions";
import {
  formatFinanceCurrency,
  parseBankStatement,
  type FinancialAccount,
  type StatementRow,
} from "./finance-model";
import styles from "./finance-dashboard.module.css";

const initialState: FinanceActionState = { status: "idle", message: "" };

type Preview = {
  rows: StatementRow[];
  skipped: number;
  error: string;
};

const emptyPreview: Preview = { rows: [], skipped: 0, error: "" };

export function StatementImporter({
  accounts,
  selectedAccountId,
}: {
  accounts: FinancialAccount[];
  selectedAccountId: string | null;
}) {
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
      const parsed = parseBankStatement(await file.text(), file.name);
      setPreview({ rows: parsed.rows, skipped: parsed.skipped, error: "" });
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

  const incomeCount = preview.rows.filter(
    (row) => row.transactionType === "income",
  ).length;
  const expenseCount = preview.rows.length - incomeCount;

  return (
    <form action={formAction} className={styles.importForm}>
      <div className={styles.importControls}>
        <label>
          <span>Conta do extrato</span>
          <select
            defaultValue={selectedAccountId ?? accounts[0]?.id ?? ""}
            name="accountId"
            required
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.fileDrop}>
          <span aria-hidden="true" className={styles.fileIllustration}>
            <span />
          </span>
          <span>
            <strong>Escolha o extrato do banco</strong>
            <small>CSV ou OFX · até 1 MB</small>
          </span>
          <input
            accept=".csv,.ofx,text/csv,application/x-ofx"
            name="statement"
            onChange={(event) => previewFile(event.target.files?.[0])}
            required
            type="file"
          />
        </label>
      </div>

      {preview.error ? (
        <p className={styles.importError} role="alert">
          {preview.error}
        </p>
      ) : null}

      {preview.rows.length > 0 ? (
        <div className={styles.importReview}>
          <div className={styles.reviewSummary}>
            <strong>Revise antes de importar</strong>
            <span>
              {incomeCount} entrada{incomeCount === 1 ? "" : "s"} ·{" "}
              {expenseCount} saída{expenseCount === 1 ? "" : "s"}
              {preview.skipped > 0
                ? ` · ${preview.skipped} linha${preview.skipped === 1 ? "" : "s"} inválida${preview.skipped === 1 ? "" : "s"}`
                : ""}
            </span>
          </div>
          <div className={styles.reviewTableWrap}>
            <table aria-label="Prévia do extrato">
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Descrição</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Valor</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 8).map((row) => (
                  <tr key={`${row.rowNumber}-${row.description}`}>
                    <td>{row.occurredOn.split("-").reverse().join("/")}</td>
                    <td>{row.description}</td>
                    <td>
                      {row.transactionType === "income"
                        ? "Entrada"
                        : "Saída"}
                    </td>
                    <td>{formatFinanceCurrency(row.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.rows.length > 8 ? (
            <small>Mais {preview.rows.length - 8} linhas serão importadas.</small>
          ) : null}
        </div>
      ) : null}

      <div className={styles.formFooter}>
        <p
          aria-live="polite"
          className={styles.actionMessage}
          data-status={state.status}
          role={state.message ? "status" : undefined}
        >
          {state.message ||
            "Créditos e débitos são revisados; duplicados não entram de novo."}
        </p>
        <button
          className={styles.secondaryButton}
          disabled={
            pending || preview.rows.length === 0 || accounts.length === 0
          }
          type="submit"
        >
          {pending ? "Importando…" : "Confirmar importação"}
        </button>
      </div>
    </form>
  );
}
