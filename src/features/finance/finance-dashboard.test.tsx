import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FinanceSnapshot } from "./finance-model";
import { FinanceDashboard } from "./finance-dashboard";

const snapshot: FinanceSnapshot = {
  fixedTotal: 1_850.9,
  variableTotal: 432.1,
  monthTotal: 2_283,
  topCategory: "Moradia",
  topCategoryTotal: 1_850.9,
  visibleExpenses: [
    {
      id: "ac1a3649-490e-4f3d-a76b-1db51f11c447",
      expenseType: "fixed",
      description: "Aluguel",
      category: "Moradia",
      amount: 1_850.9,
      expenseDate: "2026-07-01",
      dueDay: 5,
      source: "manual",
      active: true,
    },
    {
      id: "2047f063-5205-4303-9028-c5ee1f690693",
      expenseType: "variable",
      description: "Mercado",
      category: "Alimentação",
      amount: 432.1,
      expenseDate: "2026-07-22",
      dueDay: null,
      source: "bank_import",
      active: true,
    },
  ],
};

describe("FinanceDashboard", () => {
  it("reúne panorama, lançamentos, inclusão, importação e assistente", () => {
    render(
      <FinanceDashboard
        defaultDate="2026-07-23"
        greetingName="Lu"
        monthLabel="julho de 2026"
        snapshot={snapshot}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Finanças com clareza" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Aluguel")).toBeInTheDocument();
    expect(screen.getByText("Mercado")).toBeInTheDocument();
    expect(screen.getAllByText(/R\$\s1\.850,90/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: "Adicionar despesa" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Importar extrato" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Conversa financeira" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Principal" }),
    ).toBeInTheDocument();
  });
});
