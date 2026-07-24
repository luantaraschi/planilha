"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addExpense, type FinanceActionState } from "./finance-actions";
import { expenseCategories, type ExpenseType } from "./finance-model";
import styles from "./finance-dashboard.module.css";

const initialState: FinanceActionState = { status: "idle", message: "" };

export function ExpenseForm({ defaultDate }: { defaultDate: string }) {
  const [expenseType, setExpenseType] = useState<ExpenseType>("fixed");
  const [state, formAction, pending] = useActionState(
    addExpense,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form action={formAction} className={styles.expenseForm} ref={formRef}>
      <div className={styles.formGrid}>
        <label>
          <span>Tipo</span>
          <select
            name="expenseType"
            onChange={(event) =>
              setExpenseType(event.target.value as ExpenseType)
            }
            value={expenseType}
          >
            <option value="fixed">Fixa</option>
            <option value="variable">Variável</option>
          </select>
        </label>
        <label className={styles.descriptionField}>
          <span>Descrição</span>
          <input
            autoComplete="off"
            maxLength={120}
            name="description"
            placeholder="Ex.: aluguel, mercado"
            required
          />
        </label>
        <label>
          <span>Categoria</span>
          <select defaultValue="Moradia" name="category">
            {expenseCategories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Valor</span>
          <span className={styles.moneyInput}>
            <span aria-hidden="true">R$</span>
            <input
              autoComplete="off"
              inputMode="decimal"
              name="amount"
              placeholder="0,00"
              required
            />
          </span>
        </label>
        <label>
          <span>Data</span>
          <input defaultValue={defaultDate} name="expenseDate" required type="date" />
        </label>
        {expenseType === "fixed" ? (
          <label>
            <span>Dia do vencimento</span>
            <input
              defaultValue="10"
              max="31"
              min="1"
              name="dueDay"
              required
              type="number"
            />
          </label>
        ) : null}
      </div>

      <div className={styles.formFooter}>
        <p
          aria-live="polite"
          className={styles.actionMessage}
          data-status={state.status}
          role={state.message ? "status" : undefined}
        >
          {state.message || "Os dados ficam visíveis apenas na sua conta."}
        </p>
        <button className={styles.primaryButton} disabled={pending} type="submit">
          {pending ? "Salvando…" : "Adicionar despesa"}
        </button>
      </div>
    </form>
  );
}
