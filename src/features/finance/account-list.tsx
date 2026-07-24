import type { FinancialAccount } from "./finance-model";
import { formatFinanceCurrency } from "./finance-model";
import styles from "./finance-dashboard.module.css";

const accountTypeLabel: Record<FinancialAccount["accountType"], string> = {
  checking: "Conta corrente",
  cash: "Dinheiro",
  savings: "Reserva",
  credit: "Crédito",
};

export function AccountList({
  accounts,
  selectedAccountId,
}: {
  accounts: FinancialAccount[];
  selectedAccountId: string | null;
}) {
  return (
    <section aria-labelledby="accounts-title" className={styles.accountStrip}>
      <div className={styles.accountIntro}>
        <h2 id="accounts-title">Contas</h2>
        <p>Veja tudo junto ou aproxime uma conta.</p>
      </div>
      <form className={styles.accountSelector} method="get">
        <label htmlFor="finance-account">Conta exibida</label>
        <select
          defaultValue={selectedAccountId ?? ""}
          id="finance-account"
          name="conta"
        >
          <option value="">Todas as contas</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <button type="submit">Aplicar</button>
      </form>
      <ul className={styles.accountList}>
        {accounts.map((account) => (
          <li
            data-selected={
              selectedAccountId === account.id ? "true" : undefined
            }
            key={account.id}
          >
            <span>
              <strong>{account.name}</strong>
              <small>{accountTypeLabel[account.accountType]}</small>
            </span>
            <span>
              <small>Saldo inicial</small>
              <strong>
                {formatFinanceCurrency(account.openingBalanceCents)}
              </strong>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
