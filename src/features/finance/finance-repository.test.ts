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
  addCurrentExpense,
  deleteCurrentExpense,
  importCurrentExpenses,
  listCurrentExpenses,
} from "./finance-repository";

describe("finance repository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createClient.mockResolvedValue({ from: mocks.from });
    mocks.getVerifiedUserId.mockResolvedValue("user-123");
  });

  it("loads exact expense fields for the verified user", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "expense-1",
          expense_type: "variable",
          description: "Mercado",
          category: "Alimentação",
          amount: 82.4,
          expense_date: "2026-07-20",
          due_day: null,
          source: "manual",
          active: true,
        },
      ],
      error: null,
    });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    mocks.from.mockReturnValue({ select });

    await expect(listCurrentExpenses()).resolves.toEqual([
      {
        id: "expense-1",
        expenseType: "variable",
        description: "Mercado",
        category: "Alimentação",
        amount: 82.4,
        expenseDate: "2026-07-20",
        dueDay: null,
        source: "manual",
        active: true,
      },
    ]);
    expect(mocks.from).toHaveBeenCalledWith("expenses");
    expect(select).toHaveBeenCalledWith(
      "id, expense_type, description, category, amount, expense_date, due_day, source, active",
    );
    expect(eq).toHaveBeenCalledWith("user_id", "user-123");
  });

  it("inserts a manual expense under the verified user", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ insert });

    await expect(
      addCurrentExpense({
        expenseType: "fixed",
        description: "Aluguel",
        category: "Moradia",
        amount: 1800,
        expenseDate: "2026-07-05",
        dueDay: 5,
      }),
    ).resolves.toBe(true);

    expect(insert).toHaveBeenCalledWith({
      user_id: "user-123",
      expense_type: "fixed",
      description: "Aluguel",
      category: "Moradia",
      amount: 1800,
      expense_date: "2026-07-05",
      due_day: 5,
      source: "manual",
    });
  });

  it("skips statement rows already imported", async () => {
    const inFilter = vi.fn(
      async (_column: string, fingerprints: string[]) => ({
        data: [{ import_fingerprint: fingerprints[0] }],
        error: null,
      }),
    );
    const eq = vi.fn(() => ({ in: inFilter }));
    const select = vi.fn(() => ({ eq }));
    const insert = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ select, insert });

    await expect(
      importCurrentExpenses([
        {
          description: "Padaria",
          amount: 32.5,
          expenseDate: "2026-07-21",
          category: "Outros",
        },
        {
          description: "Farmácia",
          amount: 48,
          expenseDate: "2026-07-22",
          category: "Saúde",
        },
      ]),
    ).resolves.toEqual({ imported: 1, duplicates: 1 });
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: "user-123",
        description: "Farmácia",
        source: "bank_import",
      }),
    ]);
  });

  it("deletes only an expense owned by the verified user", async () => {
    const secondEq = vi.fn().mockResolvedValue({ error: null });
    const firstEq = vi.fn(() => ({ eq: secondEq }));
    const deleteExpense = vi.fn(() => ({ eq: firstEq }));
    mocks.from.mockReturnValue({ delete: deleteExpense });

    await expect(deleteCurrentExpense("expense-1")).resolves.toBe(true);
    expect(firstEq).toHaveBeenCalledWith("user_id", "user-123");
    expect(secondEq).toHaveBeenCalledWith("id", "expense-1");
  });
});
