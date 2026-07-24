import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FinanceWorkspace } from "./finance-model";
import { FinanceDashboard } from "./finance-dashboard";

const workspace: FinanceWorkspace = {
  selectedAccountId: null,
  accounts: [
    {
      id: "10000000-0000-4000-8000-000000000001",
      name: "Conta principal",
      accountType: "checking",
      openingBalanceCents: 100_000,
      active: true,
    },
    {
      id: "10000000-0000-4000-8000-000000000002",
      name: "Reserva",
      accountType: "savings",
      openingBalanceCents: 50_000,
      active: true,
    },
  ],
  categories: [
    {
      id: "20000000-0000-4000-8000-000000000001",
      name: "Salário",
      categoryType: "income",
      active: true,
    },
    {
      id: "20000000-0000-4000-8000-000000000002",
      name: "Moradia",
      categoryType: "expense",
      active: true,
    },
  ],
  transactions: [
    {
      id: "30000000-0000-4000-8000-000000000001",
      accountId: "10000000-0000-4000-8000-000000000001",
      transactionType: "income",
      amountCents: 500_000,
      occurredOn: "2026-07-05",
      dueOn: null,
      status: "cleared",
      description: "Salário",
      categoryId: "20000000-0000-4000-8000-000000000001",
      categoryName: "Salário",
      transferAccountId: null,
      source: "manual",
    },
    {
      id: "30000000-0000-4000-8000-000000000002",
      accountId: "10000000-0000-4000-8000-000000000001",
      transactionType: "expense",
      amountCents: 180_000,
      occurredOn: "2026-07-08",
      dueOn: null,
      status: "cleared",
      description: "Aluguel",
      categoryId: "20000000-0000-4000-8000-000000000002",
      categoryName: "Moradia",
      transferAccountId: null,
      source: "manual",
    },
  ],
  recurringEntries: [
    {
      id: "recurring-1",
      accountId: "10000000-0000-4000-8000-000000000001",
      transactionType: "expense",
      amountCents: 9_000,
      description: "Internet",
      categoryId: "20000000-0000-4000-8000-000000000002",
      frequency: "monthly",
      nextDueOn: "2026-07-28",
      dueDay: 28,
      active: true,
    },
  ],
  budgets: [
    {
      id: "budget-1",
      categoryId: null,
      month: "2026-07-01",
      amountCents: 250_000,
    },
  ],
  goals: [],
  summary: {
    incomeCents: 500_000,
    expenseCents: 180_000,
    resultCents: 320_000,
    projectedEndBalanceCents: 411_000,
    freePerDayCents: 8_750,
    confidence: "complete",
    missingInputs: [],
    budgetRemainingCents: 70_000,
    forecastIncomeCents: 0,
    forecastExpenseCents: 9_000,
  },
};

describe("FinanceDashboard", () => {
  it("shows monthly inflow, outflow and result with text and bars", () => {
    render(
      <FinanceDashboard
        defaultDate="2026-07-24"
        greetingName="Lu"
        monthLabel="julho de 2026"
        workspace={workspace}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Seu mês em equilíbrio" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Entradas").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Saídas").length).toBeGreaterThan(0);
    expect(screen.getByText("Resultado")).toBeInTheDocument();
    expect(screen.getAllByText(/R\$\s5\.000,00/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("img", { name: "Comparação entre entradas e saídas" }),
    ).toHaveTextContent("Entradas R$ 5.000,00; saídas R$ 1.800,00");
  });

  it("provides account selection, ledger, recurring forecast and budget context", () => {
    render(
      <FinanceDashboard
        defaultDate="2026-07-24"
        greetingName="Lu"
        monthLabel="julho de 2026"
        workspace={workspace}
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "Conta exibida" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: "Lançamentos de julho de 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Aluguel")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Próximos recorrentes" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Internet")).toBeInTheDocument();
    expect(screen.getByText("R$ 700,00 restantes")).toBeInTheDocument();
    expect(screen.getByText("R$ 87,50 livres por dia")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Novo lançamento" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Revisar extrato" }),
    ).toBeInTheDocument();
  });

  it("shows transfer endpoints and keeps imported history non-destructive", () => {
    render(
      <FinanceDashboard
        defaultDate="2026-07-24"
        greetingName="Lu"
        monthLabel="julho de 2026"
        workspace={{
          ...workspace,
          transactions: [
            {
              ...workspace.transactions[0],
              id: "30000000-0000-4000-8000-000000000009",
              description: "Extrato protegido",
              source: "bank_import",
            },
            {
              ...workspace.transactions[0],
              id: "30000000-0000-4000-8000-000000000010",
              description: "Guardar na reserva",
              transactionType: "transfer",
              categoryId: null,
              categoryName: null,
              transferAccountId:
                "10000000-0000-4000-8000-000000000002",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Conta principal → Reserva")).toBeInTheDocument();
    expect(screen.getByText("Preservado no histórico")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remover Extrato protegido" }),
    ).not.toBeInTheDocument();
  });
});
