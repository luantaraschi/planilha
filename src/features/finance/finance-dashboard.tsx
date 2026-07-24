import type { CSSProperties } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { GardenIcon } from "@/components/garden-icon";
import { deleteExpense } from "./finance-actions";
import { ExpenseForm } from "./expense-form";
import { FinanceAssistant } from "./finance-assistant";
import {
  formatFinanceCurrency,
  type Expense,
  type FinanceSnapshot,
} from "./finance-model";
import { StatementImporter } from "./statement-importer";
import styles from "./finance-dashboard.module.css";

function ExpenseRow({ expense }: { expense: Expense }) {
  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${expense.expenseDate}T12:00:00Z`));

  return (
    <li className={styles.expenseRow}>
      <span aria-hidden="true" className={styles.expenseDot} />
      <span className={styles.expenseName}>
        <strong>{expense.description}</strong>
        <small>
          {expense.category}
          {expense.source === "bank_import" ? " · extrato" : ""}
        </small>
      </span>
      <span className={styles.expenseDate}>
        {expense.expenseType === "fixed" && expense.dueDay
          ? `vence dia ${expense.dueDay}`
          : dateLabel}
      </span>
      <strong className={styles.expenseAmount}>
        {formatFinanceCurrency(expense.amount)}
      </strong>
      <form action={deleteExpense}>
        <input name="expenseId" type="hidden" value={expense.id} />
        <button
          aria-label={`Remover ${expense.description}`}
          className={styles.removeButton}
          type="submit"
        >
          ×
        </button>
      </form>
    </li>
  );
}

function LedgerGroup({
  expenses,
  title,
  total,
  type,
}: {
  expenses: Expense[];
  title: string;
  total: number;
  type: "fixed" | "variable";
}) {
  return (
    <section className={styles.ledgerGroup} data-type={type}>
      <header>
        <div>
          <span aria-hidden="true" className={styles.groupMark} />
          <h3>{title}</h3>
          <small>
            {expenses.length}{" "}
            {expenses.length === 1 ? "lançamento" : "lançamentos"}
          </small>
        </div>
        <strong>{formatFinanceCurrency(total)}</strong>
      </header>
      {expenses.length > 0 ? (
        <ul className={styles.expenseList}>
          {expenses.map((expense) => (
            <ExpenseRow expense={expense} key={expense.id} />
          ))}
        </ul>
      ) : (
        <p className={styles.emptyLedger}>
          Nada por aqui ainda. Use “Adicionar despesa” logo abaixo.
        </p>
      )}
    </section>
  );
}

export function FinanceDashboard({
  defaultDate,
  greetingName,
  monthLabel,
  snapshot,
}: {
  defaultDate: string;
  greetingName: string;
  monthLabel: string;
  snapshot: FinanceSnapshot;
}) {
  const fixedExpenses = snapshot.visibleExpenses.filter(
    (expense) => expense.expenseType === "fixed",
  );
  const variableExpenses = snapshot.visibleExpenses.filter(
    (expense) => expense.expenseType === "variable",
  );
  const fixedShare =
    snapshot.monthTotal > 0
      ? Math.round((snapshot.fixedTotal / snapshot.monthTotal) * 100)
      : 0;

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#conteudo-financeiro">
        Pular para o conteúdo
      </a>
      <AppSidebar active="finance" />

      <main className={styles.main} id="conteudo-financeiro">
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Olá, {greetingName}</p>
            <h1>Finanças com clareza</h1>
            <p>
              Seu livro de gastos de <strong>{monthLabel}</strong>.
            </p>
          </div>
          <span aria-hidden="true" className={styles.headerIllustration}>
            <GardenIcon name="finance" size={52} />
            <i />
          </span>
        </header>

        <section
          aria-labelledby="month-overview-title"
          className={styles.monthRibbon}
          style={{ "--fixed-share": `${fixedShare}%` } as CSSProperties}
        >
          <div className={styles.ribbonTotal}>
            <span id="month-overview-title">Despesas do mês</span>
            <strong>{formatFinanceCurrency(snapshot.monthTotal)}</strong>
          </div>
          <div className={styles.composition}>
            <span className={styles.fixedSegment} />
            <span className={styles.variableSegment} />
          </div>
          <dl className={styles.ribbonLegend}>
            <div>
              <dt>
                <span aria-hidden="true" />
                Fixas
              </dt>
              <dd>{formatFinanceCurrency(snapshot.fixedTotal)}</dd>
            </div>
            <div>
              <dt>
                <span aria-hidden="true" />
                Variáveis
              </dt>
              <dd>{formatFinanceCurrency(snapshot.variableTotal)}</dd>
            </div>
          </dl>
          <p>
            {snapshot.topCategory
              ? `${snapshot.topCategory} é a categoria com maior peso agora.`
              : "Adicione o primeiro gasto para ver a composição do mês."}
          </p>
        </section>

        <div className={styles.workspace}>
          <div className={styles.book}>
            <section aria-labelledby="ledger-title" className={styles.ledger}>
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.kicker}>Visão organizada</p>
                  <h2 id="ledger-title">Livro do mês</h2>
                </div>
                <span>
                  {snapshot.visibleExpenses.length}{" "}
                  {snapshot.visibleExpenses.length === 1 ? "item" : "itens"}
                </span>
              </div>
              <div className={styles.ledgerColumns}>
                <LedgerGroup
                  expenses={fixedExpenses}
                  title="Gastos fixos"
                  total={snapshot.fixedTotal}
                  type="fixed"
                />
                <LedgerGroup
                  expenses={variableExpenses}
                  title="Despesas variáveis"
                  total={snapshot.variableTotal}
                  type="variable"
                />
              </div>
            </section>

            <section
              aria-labelledby="add-expense-title"
              className={styles.toolSection}
            >
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.kicker}>Novo lançamento</p>
                  <h2 id="add-expense-title">Adicionar despesa</h2>
                </div>
                <GardenIcon name="notes" size={29} />
              </div>
              <ExpenseForm defaultDate={defaultDate} />
            </section>

            <section
              aria-labelledby="import-title"
              className={styles.toolSection}
            >
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.kicker}>Poupe digitação</p>
                  <h2 id="import-title">Importar extrato</h2>
                </div>
                <GardenIcon name="finance" size={30} />
              </div>
              <StatementImporter />
            </section>
          </div>

          <FinanceAssistant snapshot={snapshot} />
        </div>
      </main>
    </div>
  );
}
