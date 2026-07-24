import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getVerifiedUserId: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("@/features/identity/identity-repository", () => ({
  getVerifiedUserId: mocks.getVerifiedUserId,
}));

import {
  addCurrentTransaction,
  deleteCurrentTransaction,
  getCurrentFinanceLedger,
  importCurrentTransactions,
} from "./finance-repository";

describe("finance repository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createClient.mockResolvedValue({ from: mocks.from, rpc: mocks.rpc });
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

  it("confirms credits and debits in one atomic RPC", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ imported_count: 1, duplicate_count: 1 }],
      error: null,
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
    expect(mocks.rpc).toHaveBeenCalledWith("confirm_statement_import", {
      account_id_input: "account-1",
      confirmation_key_input: expect.stringMatching(/^[a-f0-9]{64}$/),
      file_name_input: "extrato.csv",
      file_type_input: "csv",
      rows_input: [
        expect.objectContaining({
          amount_cents: 3_250,
          import_fingerprint: "expense-fingerprint",
          row_number: 2,
          transaction_type: "expense",
        }),
        expect.objectContaining({
          amount_cents: 20_000,
          import_fingerprint: "income-fingerprint",
          row_number: 3,
          transaction_type: "income",
        }),
      ],
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("sends a deterministic key and lets the RPC review repeated rows", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ imported_count: 1, duplicate_count: 1 }],
      error: null,
    });
    const repeatedRow = {
      description: "Pix recebido",
      amountCents: 20_000,
      occurredOn: "2026-07-22",
      transactionType: "income" as const,
      externalId: "same-fitid",
    };

    const first = await importCurrentTransactions("account-1", "extrato.ofx", [
      { ...repeatedRow, rowNumber: 1 },
      { ...repeatedRow, rowNumber: 2 },
    ]);
    const firstCall = mocks.rpc.mock.calls[0]?.[1];
    mocks.rpc.mockClear();
    await importCurrentTransactions("account-1", "extrato.ofx", [
      { ...repeatedRow, rowNumber: 1 },
      { ...repeatedRow, rowNumber: 2 },
    ]);

    expect(first).toEqual({ imported: 1, duplicates: 1 });
    expect(firstCall.rows_input).toHaveLength(2);
    expect(firstCall.rows_input[0].import_fingerprint).toBe("same-fitid");
    expect(firstCall.rows_input[1].import_fingerprint).toBe("same-fitid");
    expect(mocks.rpc.mock.calls[0]?.[1].confirmation_key_input).toBe(
      firstCall.confirmation_key_input,
    );
  });

  it("deletes manual transactions but protects imported history", async () => {
    const deleteResult = vi.fn().mockResolvedValue({ error: null });
    const deleteEqId = vi.fn(() => deleteResult());
    const deleteEqUser = vi.fn(() => ({ eq: deleteEqId }));
    const remove = vi.fn(() => ({ eq: deleteEqUser }));
    const maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: { source: "bank_import" }, error: null })
      .mockResolvedValueOnce({ data: { source: "manual" }, error: null });
    mocks.from.mockReturnValue({
      select: () => ({
        eq: () => ({ eq: () => ({ maybeSingle }) }),
      }),
      delete: remove,
    });

    await expect(
      deleteCurrentTransaction("imported-transaction"),
    ).resolves.toBe("protected");
    expect(remove).not.toHaveBeenCalled();

    await expect(
      deleteCurrentTransaction("manual-transaction"),
    ).resolves.toBe("deleted");
    expect(remove).toHaveBeenCalledOnce();
  });
});
