import { describe, expect, it } from "vitest";
import {
  buildMonthlyFinanceSummary,
  dateInTimeZone,
  formatFinanceCurrency,
  normalizeFinancialAccountInput,
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
      dueDay: 28,
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
      dueDay: 29,
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
      projectedEndBalanceCents: 0,
      freePerDayCents: null,
      missingInputs: [
        "Cadastre o saldo inicial de pelo menos uma conta.",
        "Defina um orçamento mensal para calcular o valor livre por dia.",
        "Cadastre entradas e contas recorrentes para completar a previsão.",
      ],
    });
  });

  it("generates every weekly occurrence due in the remaining month", () => {
    const recurringLedger: FinanceLedger = {
      ...ledger,
      transactions: [],
      recurringEntries: [
        {
          id: "weekly",
          accountId: "account-checking",
          transactionType: "expense",
          amountCents: 1_000,
          description: "Feira",
          categoryId: "category-home",
          frequency: "weekly",
          nextDueOn: "2026-07-01",
          dueDay: null,
          active: true,
        },
      ],
    };

    expect(
      buildMonthlyFinanceSummary(recurringLedger, "2026-07-01"),
    ).toMatchObject({
      forecastExpenseCents: 5_000,
      projectedEndBalanceCents: 145_000,
    });
  });

  it("advances an overdue monthly recurrence using its due day", () => {
    const recurringLedger: FinanceLedger = {
      ...ledger,
      transactions: [],
      recurringEntries: [
        {
          id: "monthly",
          accountId: "account-checking",
          transactionType: "expense",
          amountCents: 2_000,
          description: "Conta mensal",
          categoryId: "category-home",
          frequency: "monthly",
          nextDueOn: "2026-05-31",
          dueDay: 31,
          active: true,
        },
      ],
    };

    expect(
      buildMonthlyFinanceSummary(recurringLedger, "2026-07-24"),
    ).toMatchObject({
      forecastExpenseCents: 2_000,
      projectedEndBalanceCents: 148_000,
    });
  });

  it("excludes inactive accounts and their transactions from consolidation", () => {
    const inactiveLedger: FinanceLedger = {
      ...ledger,
      accounts: [
        ledger.accounts[0],
        { ...ledger.accounts[1], active: false },
      ],
      transactions: [
        {
          ...ledger.transactions[0],
          accountId: "account-savings",
          amountCents: 500_000,
        },
        {
          ...ledger.transactions[1],
          amountCents: 10_000,
        },
      ],
      recurringEntries: [],
    };

    expect(
      buildMonthlyFinanceSummary(inactiveLedger, "2026-07-24"),
    ).toMatchObject({
      incomeCents: 0,
      expenseCents: 10_000,
      projectedEndBalanceCents: 90_000,
    });
  });

  it("marks confidence partial when the selected account has no active recurrence", () => {
    const summary = buildMonthlyFinanceSummary(
      {
        ...ledger,
        recurringEntries: ledger.recurringEntries.map((entry) => ({
          ...entry,
          accountId: "account-savings",
          active: entry.id === "internet",
        })),
      },
      "2026-07-24",
      "account-checking",
    );

    expect(summary.confidence).toBe("partial");
    expect(summary.missingInputs).toContain(
      "Cadastre entradas e contas recorrentes para completar a previsão.",
    );
  });

  it("explains the missing initial balance when every account is inactive", () => {
    const summary = buildMonthlyFinanceSummary(
      {
        ...ledger,
        accounts: ledger.accounts.map((account) => ({
          ...account,
          active: false,
        })),
      },
      "2026-07-24",
    );

    expect(summary.confidence).toBe("partial");
    expect(summary.missingInputs).toContain(
      "Cadastre o saldo inicial de pelo menos uma conta.",
    );
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

describe("normalizeFinancialAccountInput", () => {
  it("creates a simple account with an optional initial balance", () => {
    const formData = new FormData();
    formData.set("name", "  Conta do dia a dia  ");
    formData.set("accountType", "checking");

    expect(normalizeFinancialAccountInput(formData)).toEqual({
      ok: true,
      value: {
        name: "Conta do dia a dia",
        accountType: "checking",
        openingBalanceCents: 0,
      },
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

  it("parses pt-BR and en-US thousands without corrupting cents", () => {
    const parsed = parseBankStatementCsv(
      [
        "data;descricao;valor",
        "2026-07-22;Formato BR;1.234,56",
        "2026-07-23;Formato US;1,234.56",
      ].join("\n"),
    );

    expect(parsed.rows.map((row) => row.amountCents)).toEqual([
      123_456,
      123_456,
    ]);
  });

  it("skips malformed grouping instead of importing a corrupted amount", () => {
    const parsed = parseBankStatementCsv(
      "data;descricao;valor\n2026-07-22;Inválido;1,23,4.56",
    );

    expect(parsed).toEqual({ rows: [], skipped: 1 });
  });
});

describe("dateInTimeZone", () => {
  it("uses the supplied IANA timezone around a month boundary", () => {
    const instant = new Date("2026-07-01T01:00:00Z");

    expect(dateInTimeZone(instant, "America/Bahia")).toBe("2026-06-30");
    expect(dateInTimeZone(instant, "Asia/Tokyo")).toBe("2026-07-01");
  });
});

describe("formatFinanceCurrency", () => {
  it("formats cents as BRL", () => {
    expect(formatFinanceCurrency(185_090)).toMatch(/R\$\s1\.850,90/);
  });
});
