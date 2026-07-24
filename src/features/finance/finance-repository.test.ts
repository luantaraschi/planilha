import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getVerifiedUserId: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("@/features/identity/identity-repository", () => ({
  getVerifiedUserId: mocks.getVerifiedUserId,
}));

import {
  addCurrentTransaction,
  getCurrentFinanceLedger,
  importCurrentTransactions,
} from "./finance-repository";

describe("finance repository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createClient.mockResolvedValue({ from: mocks.from });
    mocks.getVerifiedUserId.mockResolvedValue(
      "10000000-0000-4000-8000-000000000001",
    );
  });

  it("loads the complete ledger for the verified identity", async () => {
    const responses: Record<string, unknown[]> = {
      financial_accounts: [
        {
          id: "account-1",
          name: "Conta principal",
          account_type: "checking",
          opening_balance_cents: 120_000,
          active: true,
        },
      ],
      financial_categories: [
        {
          id: "category-1",
          name: "Moradia",
          category_type: "expense",
          active: true,
        },
      ],
      transactions: [
        {
          id: "transaction-1",
          account_id: "account-1",
          transaction_type: "expense",
          amount_cents: 82_40,
          occurred_on: "2026-07-20",
          due_on: null,
          status: "cleared",
          description: "Mercado",
          category_id: "category-1",
          transfer_account_id: null,
          source: "manual",
          financial_categories: { name: "Moradia" },
        },
      ],
      recurring_entries: [],
      budgets: [],
      financial_goals: [],
    };
    mocks.from.mockImplementation((table: string) => ({
      select: () => ({
        eq: () => ({
          order: async () => ({ data: responses[table], error: null }),
        }),
      }),
    }));

    await expect(getCurrentFinanceLedger()).resolves.toMatchObject({
      accounts: [
        {
          id: "account-1",
          openingBalanceCents: 120_000,
          accountType: "checking",
        },
      ],
      transactions: [
        {
          id: "transaction-1",
          amountCents: 8_240,
          categoryName: "Moradia",
        },
      ],
      recurringEntries: [],
      budgets: [],
      goals: [],
    });
    expect(mocks.from).toHaveBeenCalledWith("financial_accounts");
    expect(mocks.from).toHaveBeenCalledWith("transactions");
    expect(mocks.from).not.toHaveBeenCalledWith("expenses");
  });

  it("inserts a manual transaction in integer cents", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ insert });

    await expect(
      addCurrentTransaction({
        accountId: "account-1",
        transactionType: "expense",
        amountCents: 8_240,
        occurredOn: "2026-07-20",
        dueOn: null,
        status: "cleared",
        description: "Mercado",
        categoryId: "category-1",
        transferAccountId: null,
      }),
    ).resolves.toBe(true);

    expect(insert).toHaveBeenCalledWith({
      user_id: "10000000-0000-4000-8000-000000000001",
      account_id: "account-1",
      transaction_type: "expense",
      amount_cents: 8_240,
      occurred_on: "2026-07-20",
      due_on: null,
      status: "cleared",
      description: "Mercado",
      category_id: "category-1",
      transfer_account_id: null,
      source: "manual",
    });
  });

  it("imports credits and debits, retaining duplicate review rows", async () => {
    const transactionInsert = vi.fn(() => ({
      select: async () => ({
        data: [
          { id: "new-income", import_fingerprint: "income-fingerprint" },
        ],
        error: null,
      }),
    }));
    const reviewInsert = vi.fn().mockResolvedValue({ error: null });
    const batchUpdateEqUser = vi.fn().mockResolvedValue({ error: null });
    const batchUpdateEqId = vi.fn(() => ({ eq: batchUpdateEqUser }));
    const batchUpdate = vi.fn(() => ({ eq: batchUpdateEqId }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "financial_categories") {
        return {
          select: () => ({
            eq: () => ({
              in: async () => ({
                data: [
                  { id: "income-category", name: "Receita extra" },
                  { id: "expense-category", name: "Outros" },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "import_batches") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: { id: "batch-1" },
                error: null,
              }),
            }),
          }),
          update: batchUpdate,
        };
      }
      if (table === "transactions") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                in: async () => ({
                  data: [{ import_fingerprint: "expense-fingerprint" }],
                  error: null,
                }),
              }),
            }),
          }),
          insert: transactionInsert,
        };
      }
      return { insert: reviewInsert };
    });

    const result = await importCurrentTransactions(
      "account-1",
      "extrato.csv",
      [
        {
          rowNumber: 2,
          description: "Padaria",
          amountCents: 3_250,
          occurredOn: "2026-07-21",
          transactionType: "expense",
          externalId: "expense-fingerprint",
        },
        {
          rowNumber: 3,
          description: "Pix recebido",
          amountCents: 20_000,
          occurredOn: "2026-07-22",
          transactionType: "income",
          externalId: "income-fingerprint",
        },
      ],
    );

    expect(result).toEqual({ imported: 1, duplicates: 1 });
    expect(transactionInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        transaction_type: "income",
        amount_cents: 20_000,
        category_id: "income-category",
      }),
    ]);
    expect(reviewInsert).toHaveBeenCalledWith([
      expect.objectContaining({ review_status: "duplicate" }),
      expect.objectContaining({ review_status: "imported" }),
    ]);
    expect(batchUpdate).toHaveBeenCalledWith({
      status: "completed",
      imported_count: 1,
      duplicate_count: 1,
    });
  });

  it("marks only the repeated row as duplicate within one file", async () => {
    const reviewInsert = vi.fn().mockResolvedValue({ error: null });
    const transactionInsert = vi.fn(() => ({
      select: async () => ({
        data: [{ id: "new-income", import_fingerprint: "same-fitid" }],
        error: null,
      }),
    }));
    mocks.from.mockImplementation((table: string) => {
      if (table === "financial_categories") {
        return {
          select: () => ({
            eq: () => ({
              in: async () => ({
                data: [
                  { id: "income-category", name: "Receita extra" },
                  { id: "expense-category", name: "Outros" },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "import_batches") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: { id: "batch-1" },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              eq: async () => ({ error: null }),
            }),
          }),
        };
      }
      if (table === "transactions") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                in: async () => ({ data: [], error: null }),
              }),
            }),
          }),
          insert: transactionInsert,
        };
      }
      return { insert: reviewInsert };
    });
    const repeatedRow = {
      description: "Pix recebido",
      amountCents: 20_000,
      occurredOn: "2026-07-22",
      transactionType: "income" as const,
      externalId: "same-fitid",
    };

    await importCurrentTransactions("account-1", "extrato.ofx", [
      { ...repeatedRow, rowNumber: 1 },
      { ...repeatedRow, rowNumber: 2 },
    ]);

    expect(reviewInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        row_number: 1,
        review_status: "imported",
      }),
      expect.objectContaining({
        row_number: 2,
        review_status: "duplicate",
      }),
    ]);
  });
});
