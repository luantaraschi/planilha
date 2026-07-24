import { describe, expect, it } from "vitest";
import {
  buildMonthlyFinanceSummary,
  formatFinanceCurrency,
  normalizeTransactionInput,
  parseBankStatement,
  parseBankStatementCsv,
  parseBankStatementOfx,
  type FinanceLedger,
} from "./finance-model";

const ledger: FinanceLedger = {
  accounts: [
    {
      id: "account-checking",
      name: "Conta principal",
      accountType: "checking",
      openingBalanceCents: 100_000,
      active: true,
    },
    {
      id: "account-savings",
      name: "Reserva",
      accountType: "savings",
      openingBalanceCents: 50_000,
      active: true,
    },
  ],
  categories: [
    {
      id: "category-income",
      name: "Salário",
      categoryType: "income",
      active: true,
    },
    {
      id: "category-home",
      name: "Moradia",
      categoryType: "expense",
      active: true,
    },
  ],
  transactions: [
    {
      id: "salary",
      accountId: "account-checking",
      transactionType: "income",
      amountCents: 500_000,
      occurredOn: "2026-07-05",
      dueOn: null,
      status: "cleared",
      description: "Salário",
      categoryId: "category-income",
      categoryName: "Salário",
      transferAccountId: null,
      source: "manual",
    },
    {
      id: "rent",
      accountId: "account-checking",
      transactionType: "expense",
      amountCents: 180_000,
      occurredOn: "2026-07-08",
      dueOn: null,
      status: "cleared",
      description: "Aluguel",
      categoryId: "category-home",
      categoryName: "Moradia",
      transferAccountId: null,
      source: "manual",
    },
    {
      id: "reserve",
      accountId: "account-checking",
      transactionType: "transfer",
      amountCents: 50_000,
      occurredOn: "2026-07-10",
      dueOn: null,
      status: "cleared",
      description: "Guardar na reserva",
      categoryId: null,
      categoryName: null,
      transferAccountId: "account-savings",
      source: "manual",
    },
    {
      id: "ignored",
      accountId: "account-checking",
      transactionType: "expense",
      amountCents: 999_999,
      occurredOn: "2026-07-12",
      dueOn: null,
      status: "ignored",
      description: "Ignorado",
      categoryId: "category-home",
      categoryName: "Moradia",
      transferAccountId: null,
      source: "manual",
    },
  ],
  recurringEntries: [
    {
      id: "internet",
      accountId: "account-checking",
      transactionType: "expense",
      amountCents: 9_000,
      description: "Internet",
      categoryId: "category-home",
      frequency: "monthly",
      nextDueOn: "2026-07-28",
      active: true,
    },
    {
      id: "extra-income",
      accountId: "account-checking",
      transactionType: "income",
      amountCents: 10_000,
      description: "Receita recorrente",
      categoryId: "category-income",
      frequency: "monthly",
      nextDueOn: "2026-07-29",
      active: true,
    },
  ],
  budgets: [
    {
      id: "july-budget",
      categoryId: null,
      month: "2026-07-01",
      amountCents: 250_000,
    },
  ],
  goals: [],
};

describe("buildMonthlyFinanceSummary", () => {
  it("keeps transfers out of income and expenses while forecasting recurring entries", () => {
    expect(buildMonthlyFinanceSummary(ledger, "2026-07-24")).toEqual({
      incomeCents: 500_000,
      expenseCents: 180_000,
      resultCents: 320_000,
      projectedEndBalanceCents: 471_000,
      freePerDayCents: 8_750,
      confidence: "complete",
      missingInputs: [],
      budgetRemainingCents: 70_000,
      forecastIncomeCents: 10_000,
      forecastExpenseCents: 9_000,
    });
  });

  it("explains a partial projection instead of inventing daily precision", () => {
    const summary = buildMonthlyFinanceSummary(
      { ...ledger, accounts: [], budgets: [], recurringEntries: [] },
      "2026-07-24",
    );

    expect(summary).toMatchObject({
      confidence: "partial",
      projectedEndBalanceCents: 320_000,
      freePerDayCents: null,
      missingInputs: [
        "Cadastre o saldo inicial de pelo menos uma conta.",
        "Defina um orçamento mensal para calcular o valor livre por dia.",
        "Cadastre entradas e contas recorrentes para completar a previsão.",
      ],
    });
  });
});

describe("normalizeTransactionInput", () => {
  it("normalizes BRL directly to integer cents", () => {
    const formData = new FormData();
    formData.set("accountId", "10000000-0000-4000-8000-000000000001");
    formData.set("transactionType", "expense");
    formData.set("description", "  Mercado  ");
    formData.set("categoryId", "20000000-0000-4000-8000-000000000002");
    formData.set("amount", "82,40");
    formData.set("occurredOn", "2026-07-20");
    formData.set("status", "cleared");

    expect(normalizeTransactionInput(formData)).toEqual({
      ok: true,
      value: {
        accountId: "10000000-0000-4000-8000-000000000001",
        transactionType: "expense",
        description: "Mercado",
        categoryId: "20000000-0000-4000-8000-000000000002",
        amountCents: 8_240,
        occurredOn: "2026-07-20",
        dueOn: null,
        status: "cleared",
        transferAccountId: null,
      },
    });
  });

  it("requires a distinct destination for transfers", () => {
    const formData = new FormData();
    formData.set("accountId", "10000000-0000-4000-8000-000000000001");
    formData.set("transactionType", "transfer");
    formData.set("description", "Reserva");
    formData.set("amount", "100,00");
    formData.set("occurredOn", "2026-07-20");
    formData.set("status", "cleared");
    formData.set(
      "transferAccountId",
      "10000000-0000-4000-8000-000000000001",
    );

    expect(normalizeTransactionInput(formData)).toEqual({
      ok: false,
      message: "Escolha uma conta de destino diferente.",
    });
  });
});

describe("statement parsers", () => {
  it("reviews CSV credits and debits in integer cents", () => {
    expect(
      parseBankStatementCsv(
        [
          "data;descricao;valor;tipo",
          "21/07/2026;Padaria;-32,50;Débito",
          "22/07/2026;Pix recebido;200,00;Crédito",
        ].join("\n"),
      ),
    ).toEqual({
      rows: [
        {
          rowNumber: 2,
          description: "Padaria",
          amountCents: 3_250,
          occurredOn: "2026-07-21",
          transactionType: "expense",
          externalId: null,
        },
        {
          rowNumber: 3,
          description: "Pix recebido",
          amountCents: 20_000,
          occurredOn: "2026-07-22",
          transactionType: "income",
          externalId: null,
        },
      ],
      skipped: 0,
    });
  });

  it("reviews OFX credits and debits and keeps FITID for deduplication", () => {
    const parsed = parseBankStatementOfx(`
      <OFX><BANKTRANLIST>
        <STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260722<TRNAMT>-81.40<FITID>d-1<NAME>Mercado</STMTTRN>
        <STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260723<TRNAMT>200.00<FITID>c-1<MEMO>Pix recebido</STMTTRN>
      </BANKTRANLIST></OFX>
    `);

    expect(parsed.rows).toEqual([
      expect.objectContaining({
        transactionType: "expense",
        amountCents: 8_140,
        externalId: "d-1",
      }),
      expect.objectContaining({
        transactionType: "income",
        amountCents: 20_000,
        externalId: "c-1",
      }),
    ]);
  });

  it("chooses the parser by filename", () => {
    expect(
      parseBankStatement(
        "data,descricao,valor\n2026-07-22,Salário,5000.00",
        "conta.csv",
      ).rows[0]?.transactionType,
    ).toBe("income");
  });
});

describe("formatFinanceCurrency", () => {
  it("formats cents as BRL", () => {
    expect(formatFinanceCurrency(185_090)).toMatch(/R\$\s1\.850,90/);
  });
});
