"use client";

import { useActionState } from "react";
import { deleteTransaction, type FinanceActionState } from "./finance-actions";
import styles from "./finance-dashboard.module.css";

const initialState: FinanceActionState = { status: "idle", message: "" };

export function TransactionDeleteForm({
  description,
  transactionId,
}: {
  description: string;
  transactionId: string;
}) {
  const [state, action, pending] = useActionState(
    deleteTransaction,
    initialState,
  );

  return (
    <form action={action} className={styles.deleteForm}>
      <input name="transactionId" type="hidden" value={transactionId} />
      <button
        aria-label={`Remover ${description}`}
        className={styles.removeButton}
        disabled={pending}
        type="submit"
      >
        {pending ? "Removendo…" : "Remover"}
      </button>
      {state.message ? (
        <span
          aria-live="polite"
          className={styles.deleteMessage}
          data-status={state.status}
        >
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
