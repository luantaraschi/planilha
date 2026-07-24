import type { CSSProperties } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { GardenIcon } from "@/components/garden-icon";
import { AccountList } from "./account-list";
import { deleteTransaction } from "./finance-actions";
import { FinanceAssistant } from "./finance-assistant";
import {
  formatFinanceCurrency,
  type FinanceWorkspace,
  type FinancialTransaction,
} from "./finance-model";
import { StatementImporter } from "./statement-importer";
import { TransactionForm } from "./transaction-form";
import styles from "./finance-dashboard.module.css";

const transactionLabels: Record<
  FinancialTransaction["transactionType"],
  string
> = {
  income: "Entrada",
  expense: "Saída",
  transfer: "Transferência",
  adjustment: "Ajuste",
};

function SummaryChart({
  expenseCents,
  incomeCents,
}: {
  expenseCents: number;
  incomeCents: number;
}) {
  const ceiling = Math.max(incomeCents, expenseCents, 1);
  const chartStyle = {
    "--income-width": `${(incomeCents / ceiling) * 100}%`,
    "--expense-width": `${(expenseCents / ceiling) * 100}%`,
  } as CSSProperties;

  return (
    <div
      aria-label="Comparação entre entradas e saídas"
      className={styles.summaryChart}
      role="img"
      style={chartStyle}
    >
      <span className={styles.srOnly}>
        Entradas {formatFinanceCurrency(incomeCents)}; saídas{" "}
        {formatFinanceCurrency(expenseCents)}
      </span>
      <span className={styles.chartRow}>
        <span>Entradas</span>
        <i data-kind="income" />
      </span>
      <span className={styles.chartRow}>
        <span>Saídas</span>
        <i data-kind="expense" />
      </span>
    </div>
  );
}

function TransactionTable({
  accountNames,
  monthLabel,
  transactions,
}: {
  accountNames: Map<string, string>;
  monthLabel: string;
  transactions: FinancialTransaction[];
}) {
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });

  return (
    <div className={styles.tableWrap}>
      <table aria-label={`Lançamentos de ${monthLabel}`}>
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Lançamento</th>
            <th scope="col">Conta</th>
            <th scope="col">Tipo</th>
            <th scope="col">Valor</th>
            <th scope="col">
              <span className={styles.srOnly}>Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>
                  {dateFormatter.format(
                    new Date(`${transaction.occurredOn}T12:00:00Z`),
                  )}
                </td>
                <td>
                  <strong>{transaction.description}</strong>
                  <small>
                    {transaction.categoryName ??
                      (transaction.source === "bank_import"
                        ? "Importado do extrato"
                        : "Sem categoria")}
                  </small>
                </td>
                <td>{accountNames.get(transaction.accountId) ?? "Conta"}</td>
                <td>
                  <span
                    className={styles.typeLabel}
                    data-kind={transaction.transactionType}
                  >
                    {transactionLabels[transaction.transactionType]}
                  </span>
                </td>
                <td>
                  <strong className={styles.amount}>
                    {transaction.transactionType === "expense" ? "−" : ""}
                    {transaction.transactionType === "income" ? "+" : ""}
                    {formatFinanceCurrency(transaction.amountCents)}
                  </strong>
                </td>
                <td>
                  <form action={deleteTransaction}>
                    <input
                      name="transactionId"
                      type="hidden"
                      value={transaction.id}
                    />
                    <button
                      aria-label={`Remover ${transaction.description}`}
                      className={styles.removeButton}
                      type="submit"
                    >
                      Remover
                    </button>
                  </form>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className={styles.emptyLedger} colSpan={6}>
                Nenhum lançamento neste recorte. Adicione o primeiro logo
                abaixo.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function FinanceDashboard({
  defaultDate,
  greetingName,
  monthLabel,
  workspace,
}: {
  defaultDate: string;
  greetingName: string;
  monthLabel: string;
  workspace: FinanceWorkspace;
}) {
  const accountNames = new Map(
    workspace.accounts.map((account) => [account.id, account.name]),
  );
  const transactions = workspace.transactions.filter(
    (transaction) =>
      transaction.status !== "ignored" &&
      transaction.occurredOn.startsWith(defaultDate.slice(0, 7)) &&
      (!workspace.selectedAccountId ||
        transaction.accountId === workspace.selectedAccountId ||
        transaction.transferAccountId === workspace.selectedAccountId),
  );
  const recurringEntries = workspace.recurringEntries.filter(
    (entry) =>
      entry.active &&
      (!workspace.selectedAccountId ||
        entry.accountId === workspace.selectedAccountId),
  );
  const { summary } = workspace;

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#conteudo-financeiro">
        Pular para o conteúdo
      </a>
      <AppSidebar active="finance" />

      <main className={styles.main} id="conteudo-financeiro">
        <header className={styles.pageHeader}>
          <div>
            <p>Olá, {greetingName}</p>
            <h1>Seu mês em equilíbrio</h1>
            <p>
              Entradas, saídas e próximos passos de{" "}
              <strong>{monthLabel}</strong>.
            </p>
          </div>
          <span aria-hidden="true" className={styles.headerIllustration}>
            <GardenIcon name="finance" size={54} />
            <i />
          </span>
        </header>

        <AccountList
          accounts={workspace.accounts}
          selectedAccountId={workspace.selectedAccountId}
        />

        <section
          aria-labelledby="monthly-summary-title"
          className={styles.monthlySummary}
        >
          <div className={styles.summaryIntro}>
            <span id="monthly-summary-title">Pulso do mês</span>
            <p>Transferências ficam fora deste comparativo.</p>
          </div>
          <dl className={styles.summaryValues}>
            <div data-kind="income">
              <dt>Entradas</dt>
              <dd>{formatFinanceCurrency(summary.incomeCents)}</dd>
            </div>
            <div data-kind="expense">
              <dt>Saídas</dt>
              <dd>{formatFinanceCurrency(summary.expenseCents)}</dd>
            </div>
            <div data-kind="result">
              <dt>Resultado</dt>
              <dd>{formatFinanceCurrency(summary.resultCents)}</dd>
            </div>
          </dl>
          <SummaryChart
            expenseCents={summary.expenseCents}
            incomeCents={summary.incomeCents}
          />
        </section>

        <div className={styles.workspace}>
          <div className={styles.ledgerColumn}>
            <section aria-labelledby="ledger-title" className={styles.ledger}>
              <div className={styles.sectionHeading}>
                <div>
                  <h2 id="ledger-title">Livro do mês</h2>
                  <p>
                    {transactions.length}{" "}
                    {transactions.length === 1
                      ? "lançamento visível"
                      : "lançamentos visíveis"}
                  </p>
                </div>
                <GardenIcon name="notes" size={29} />
              </div>
              <TransactionTable
                accountNames={accountNames}
                monthLabel={monthLabel}
                transactions={transactions}
              />
            </section>

            <section
              aria-labelledby="transaction-title"
              className={styles.toolSection}
            >
              <div className={styles.sectionHeading}>
                <div>
                  <h2 id="transaction-title">Novo lançamento</h2>
                  <p>Entrada, saída, transferência ou ajuste.</p>
                </div>
                <GardenIcon name="finance" size={29} />
              </div>
              <TransactionForm
                accounts={workspace.accounts}
                categories={workspace.categories}
                defaultDate={defaultDate}
              />
            </section>

            <section
              aria-labelledby="import-title"
              className={styles.toolSection}
            >
              <div className={styles.sectionHeading}>
                <div>
                  <h2 id="import-title">Revisar extrato</h2>
                  <p>Confira entradas e saídas antes de confirmar.</p>
                </div>
                <GardenIcon name="tasks" size={29} />
              </div>
              <StatementImporter
                accounts={workspace.accounts}
                selectedAccountId={workspace.selectedAccountId}
              />
            </section>
          </div>

          <aside aria-label="Planejamento financeiro" className={styles.planColumn}>
            <section className={styles.forecast}>
              <header>
                <div>
                  <h2>Previsão até o fim do mês</h2>
                  <p>
                    {summary.confidence === "complete"
                      ? "Projeção completa"
                      : "Projeção parcial"}
                  </p>
                </div>
                <GardenIcon name="goals" size={28} />
              </header>
              <strong>
                {formatFinanceCurrency(summary.projectedEndBalanceCents)}
              </strong>
              <dl>
                <div>
                  <dt>Entradas previstas</dt>
                  <dd>{formatFinanceCurrency(summary.forecastIncomeCents)}</dd>
                </div>
                <div>
                  <dt>Contas previstas</dt>
                  <dd>{formatFinanceCurrency(summary.forecastExpenseCents)}</dd>
                </div>
              </dl>
              {summary.missingInputs.length > 0 ? (
                <ul className={styles.missingInputs}>
                  {summary.missingInputs.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className={styles.budgetPanel}>
              <header>
                <h2>Orçamento</h2>
                <GardenIcon name="wellbeing" size={27} />
              </header>
              {summary.budgetRemainingCents === null ? (
                <p>Defina um orçamento para acompanhar o que ainda cabe no mês.</p>
              ) : (
                <>
                  <strong>
                    {formatFinanceCurrency(summary.budgetRemainingCents)} restantes
                  </strong>
                  <p>
                    {summary.freePerDayCents === null
                      ? "Valor diário indisponível."
                      : `${formatFinanceCurrency(summary.freePerDayCents)} livres por dia`}
                  </p>
                  <progress
                    aria-label="Orçamento mensal usado"
                    max={
                      summary.expenseCents +
                      Math.max(summary.budgetRemainingCents, 0)
                    }
                    value={summary.expenseCents}
                  />
                </>
              )}
            </section>

            <section className={styles.recurringPanel}>
              <header>
                <h2>Próximos recorrentes</h2>
                <span>{recurringEntries.length}</span>
              </header>
              {recurringEntries.length > 0 ? (
                <ul>
                  {recurringEntries.slice(0, 5).map((entry) => (
                    <li key={entry.id}>
                      <span>
                        <strong>{entry.description}</strong>
                        <small>
                          {entry.nextDueOn.split("-").reverse().join("/")}
                        </small>
                      </span>
                      <strong>
                        {entry.transactionType === "expense" ? "−" : "+"}
                        {formatFinanceCurrency(entry.amountCents)}
                      </strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Cadastre contas e entradas recorrentes para melhorar a previsão.</p>
              )}
            </section>

            <section className={styles.goalsPanel}>
              <header>
                <h2>Metas financeiras</h2>
                <GardenIcon name="goals" size={25} />
              </header>
              {workspace.goals.length > 0 ? (
                <ul>
                  {workspace.goals.slice(0, 3).map((goal) => (
                    <li key={goal.id}>
                      <span>{goal.name}</span>
                      <strong>
                        {formatFinanceCurrency(goal.savedCents)} de{" "}
                        {formatFinanceCurrency(goal.targetCents)}
                      </strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Suas metas aparecerão aqui quando forem cadastradas.</p>
              )}
            </section>
          </aside>
        </div>

        <FinanceAssistant workspace={workspace} />
      </main>
    </div>
  );
}
