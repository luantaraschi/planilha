import { describe, expect, it } from "vitest";
import {
  answerFinanceQuestion,
  buildFinanceSnapshot,
  normalizeExpenseInput,
  parseBankStatementCsv,
  type Expense,
} from "./finance-model";

const expenses: Expense[] = [
  {
    id: "fixed-rent",
    expenseType: "fixed",
    description: "Aluguel",
    category: "Moradia",
    amount: 1800,
    expenseDate: "2026-06-05",
    dueDay: 5,
    source: "manual",
    active: true,
  },
  {
    id: "market",
    expenseType: "variable",
    description: "Mercado",
    category: "Alimentação",
    amount: 420.5,
    expenseDate: "2026-07-12",
    dueDay: null,
    source: "manual",
    active: true,
  },
  {
    id: "old",
    expenseType: "variable",
    description: "Mês anterior",
    category: "Lazer",
    amount: 90,
    expenseDate: "2026-06-20",
    dueDay: null,
    source: "manual",
    active: true,
  },
];

describe("normalizeExpenseInput", () => {
  it("normalizes a fixed expense entered in BRL", () => {
    const formData = new FormData();
    formData.set("expenseType", "fixed");
    formData.set("description", "  Aluguel  ");
    formData.set("category", "Moradia");
    formData.set("amount", "1.850,90");
    formData.set("expenseDate", "2026-07-05");
    formData.set("dueDay", "5");

    expect(normalizeExpenseInput(formData)).toEqual({
      ok: true,
      value: {
        expenseType: "fixed",
        description: "Aluguel",
        category: "Moradia",
        amount: 1850.9,
        expenseDate: "2026-07-05",
        dueDay: 5,
      },
    });
  });

  it("rejects invalid amounts", () => {
    const formData = new FormData();
    formData.set("expenseType", "variable");
    formData.set("description", "Mercado");
    formData.set("category", "Alimentação");
    formData.set("amount", "zero");
    formData.set("expenseDate", "2026-07-20");

    expect(normalizeExpenseInput(formData)).toEqual({
      ok: false,
      message: "Informe um valor maior que zero.",
    });
  });
});

describe("buildFinanceSnapshot", () => {
  it("combines active fixed costs with variable expenses from the selected month", () => {
    expect(buildFinanceSnapshot(expenses, "2026-07-23")).toMatchObject({
      fixedTotal: 1800,
      variableTotal: 420.5,
      monthTotal: 2220.5,
      topCategory: "Moradia",
      visibleExpenses: [expenses[0], expenses[1]],
    });
  });
});

describe("parseBankStatementCsv", () => {
  it("imports debit rows and skips credits from a semicolon CSV", () => {
    const result = parseBankStatementCsv(
      [
        "data;descricao;valor;tipo",
        "21/07/2026;Padaria;-32,50;Débito",
        '22/07/2026;"Pix recebido";200,00;Crédito',
      ].join("\n"),
    );

    expect(result).toEqual({
      rows: [
        {
          description: "Padaria",
          amount: 32.5,
          expenseDate: "2026-07-21",
          category: "Outros",
        },
      ],
      skipped: 1,
    });
  });

  it("keeps delimiters inside quoted descriptions", () => {
    const result = parseBankStatementCsv(
      'date,description,amount\n2026-07-22,"Mercado, bairro",-81.40',
    );

    expect(result.rows[0]?.description).toBe("Mercado, bairro");
  });
});

describe("answerFinanceQuestion", () => {
  const snapshot = buildFinanceSnapshot(expenses, "2026-07-23");

  it("answers with the largest category", () => {
    expect(answerFinanceQuestion("Qual categoria pesa mais?", snapshot)).toBe(
      "Moradia é a categoria que mais pesa neste mês, com R$ 1.800,00.",
    );
  });

  it("explains the fixed-cost share", () => {
    expect(answerFinanceQuestion("Quanto tenho de gastos fixos?", snapshot)).toContain(
      "81%",
    );
  });

  it("does not mistake despesas for a category question", () => {
    expect(
      answerFinanceQuestion("Quanto gasto com despesas fixas?", snapshot),
    ).toContain("gastos fixos somam");
  });
});
