import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addCurrentTransaction: vi.fn(),
  deleteCurrentTransaction: vi.fn(),
  importCurrentTransactions: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("./finance-repository", () => ({
  addCurrentTransaction: mocks.addCurrentTransaction,
  deleteCurrentTransaction: mocks.deleteCurrentTransaction,
  importCurrentTransactions: mocks.importCurrentTransactions,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import {
  addTransaction,
  deleteTransaction,
  importStatement,
} from "./finance-actions";

const initialState = { status: "idle" as const, message: "" };

function transactionForm() {
  const formData = new FormData();
  formData.set("accountId", "10000000-0000-4000-8000-000000000001");
  formData.set("transactionType", "expense");
  formData.set("description", "Mercado");
  formData.set("categoryId", "20000000-0000-4000-8000-000000000002");
  formData.set("amount", "82,40");
  formData.set("occurredOn", "2026-07-20");
  formData.set("status", "cleared");
  return formData;
}

describe("finance actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.addCurrentTransaction.mockResolvedValue(true);
    mocks.deleteCurrentTransaction.mockResolvedValue("deleted");
    mocks.importCurrentTransactions.mockResolvedValue({
      imported: 2,
      duplicates: 0,
    });
  });

  it("adds a normalized ledger transaction", async () => {
    await expect(
      addTransaction(initialState, transactionForm()),
    ).resolves.toEqual({
      status: "success",
      message: "Lançamento adicionado.",
    });
    expect(mocks.addCurrentTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: 8_240 }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/financas");
  });

  it("imports reviewed CSV credits and debits into the selected account", async () => {
    const formData = new FormData();
    formData.set("accountId", "10000000-0000-4000-8000-000000000001");
    const contents = [
      "data;descricao;valor",
      "21/07/2026;Padaria;-32,50",
      "22/07/2026;Pix recebido;200,00",
    ].join("\n");
    const file = new File([contents], "extrato.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: async () => contents });
    formData.set("statement", file);

    await expect(importStatement(initialState, formData)).resolves.toEqual({
      status: "success",
      message: "2 lançamentos importados.",
    });
    expect(mocks.importCurrentTransactions).toHaveBeenCalledWith(
      "10000000-0000-4000-8000-000000000001",
      "extrato.csv",
      [
        expect.objectContaining({ transactionType: "expense" }),
        expect.objectContaining({ transactionType: "income" }),
      ],
    );
  });

  it("reports duplicate rows from the import review", async () => {
    mocks.importCurrentTransactions.mockResolvedValue({
      imported: 0,
      duplicates: 2,
    });
    const formData = new FormData();
    formData.set("accountId", "10000000-0000-4000-8000-000000000001");
    const contents =
      "data,descricao,valor\n2026-07-21,Padaria,-32.50\n2026-07-22,Pix,200.00";
    const file = new File([contents], "extrato.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: async () => contents });
    formData.set("statement", file);

    const result = await importStatement(initialState, formData);

    expect(result.message).toBe(
      "0 lançamentos importados. 2 duplicados ignorados.",
    );
  });

  it("deletes only UUID-shaped transaction ids", async () => {
    const invalid = new FormData();
    invalid.set("transactionId", "not-an-id");
    await expect(deleteTransaction(initialState, invalid)).resolves.toEqual({
      status: "error",
      message: "Lançamento inválido.",
    });
    expect(mocks.deleteCurrentTransaction).not.toHaveBeenCalled();

    const valid = new FormData();
    valid.set("transactionId", "30000000-0000-4000-8000-000000000003");
    await expect(deleteTransaction(initialState, valid)).resolves.toEqual({
      status: "success",
      message: "Lançamento removido.",
    });
    expect(mocks.deleteCurrentTransaction).toHaveBeenCalledWith(
      "30000000-0000-4000-8000-000000000003",
    );
  });

  it("explains when imported history cannot be removed", async () => {
    mocks.deleteCurrentTransaction.mockResolvedValue("protected");
    const formData = new FormData();
    formData.set(
      "transactionId",
      "30000000-0000-4000-8000-000000000003",
    );

    await expect(deleteTransaction(initialState, formData)).resolves.toEqual({
      status: "error",
      message: "Lançamentos importados ficam preservados no histórico.",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
