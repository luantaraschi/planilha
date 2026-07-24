"use client";

import { useActionState } from "react";
import {
  createFinancialAccount,
  type FinanceActionState,
} from "./finance-actions";
import styles from "./finance-dashboard.module.css";

const initialState: FinanceActionState = { status: "idle", message: "" };

export function FinancialAccountForm() {
  const [state, action, pending] = useActionState(
    createFinancialAccount,
    initialState,
  );
  return (
    <form action={action} className={styles.accountSetupForm}>
      <label>
        Nome da conta
        <input
          autoComplete="off"
          maxLength={80}
          name="name"
          placeholder="Ex.: Nubank, carteira, reserva"
          required
        />
      </label>
      <label>
        Tipo
        <select defaultValue="checking" name="accountType">
          <option value="checking">Conta corrente</option>
          <option value="cash">Dinheiro</option>
          <option value="savings">Reserva</option>
          <option value="credit">Cartão de crédito</option>
        </select>
      </label>
      <label>
        Saldo inicial
        <input inputMode="decimal" name="openingBalance" placeholder="0,00" />
      </label>
      <div>
        <p
          aria-live="polite"
          className={styles.actionMessage}
          data-status={state.status}
        >
          {state.message || "Você poderá adicionar outras contas depois."}
        </p>
        <button
          className={styles.primaryButton}
          disabled={pending}
          type="submit"
        >
          {pending ? "Criando…" : "Criar primeira conta"}
        </button>
      </div>
    </form>
  );
}
