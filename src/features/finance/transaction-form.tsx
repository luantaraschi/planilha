"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addTransaction, type FinanceActionState } from "./finance-actions";
import type {
  FinancialAccount,
  FinancialCategory,
  TransactionType,
} from "./finance-model";
import styles from "./finance-dashboard.module.css";

const initialState: FinanceActionState = { status: "idle", message: "" };

export function TransactionForm({
  accounts,
  categories,
  defaultDate,
}: {
  accounts: FinancialAccount[];
  categories: FinancialCategory[];
  defaultDate: string;
}) {
  const [transactionType, setTransactionType] =
    useState<TransactionType>("expense");
  const [state, formAction, pending] = useActionState(
    addTransaction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const categoryType =
    transactionType === "income" ? "income" : "expense";
  const activeAccounts = accounts.filter((account) => account.active);
  const visibleCategories = categories.filter(
    (category) =>
      category.active && category.categoryType === categoryType,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className={styles.transactionForm}
      ref={formRef}
    >
      <div className={styles.formGrid}>
        <label>
          <span>Tipo</span>
          <select
            name="transactionType"
            onChange={(event) =>
              setTransactionType(event.target.value as TransactionType)
            }
            value={transactionType}
          >
            <option value="expense">Saída</option>
            <option value="income">Entrada</option>
            <option value="transfer">Transferência</option>
            <option value="adjustment">Ajuste de saldo</option>
          </select>
        </label>
        <label>
          <span>Conta</span>
          <select name="accountId" required>
            {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
          </select>
        </label>
        {transactionType === "transfer" ? (
          <label>
            <span>Conta de destino</span>
            <select name="transferAccountId" required>
              <option value="">Escolha</option>
              {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
            </select>
          </label>
        ) : transactionType === "adjustment" ? null : (
          <label>
            <span>Categoria</span>
            <select name="categoryId" required>
              {visibleCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={styles.descriptionField}>
          <span>Descrição</span>
          <input
            autoComplete="off"
            maxLength={120}
            name="description"
            placeholder="Ex.: aluguel, salário, reserva"
            required
          />
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
          <input
            defaultValue={defaultDate}
            name="occurredOn"
            required
            type="date"
          />
        </label>
        <label>
          <span>Estado</span>
          <select defaultValue="cleared" name="status">
            <option value="cleared">Confirmado</option>
            <option value="planned">Planejado</option>
          </select>
        </label>
        <label>
          <span>Vencimento (opcional)</span>
          <input name="dueOn" type="date" />
        </label>
      </div>

      <div className={styles.formFooter}>
        <p
          aria-live="polite"
          className={styles.actionMessage}
          data-status={state.status}
          role={state.message ? "status" : undefined}
        >
          {state.message || "Valores são guardados em centavos, sem arredondamento."}
        </p>
        <button
          className={styles.primaryButton}
          disabled={pending || activeAccounts.length === 0}
          type="submit"
        >
          {pending ? "Salvando…" : "Adicionar lançamento"}
        </button>
      </div>
    </form>
  );
}
