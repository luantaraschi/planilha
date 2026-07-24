import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addCurrentExpense: vi.fn(),
  deleteCurrentExpense: vi.fn(),
  importCurrentExpenses: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("./finance-repository", () => ({
  addCurrentExpense: mocks.addCurrentExpense,
  deleteCurrentExpense: mocks.deleteCurrentExpense,
  importCurrentExpenses: mocks.importCurrentExpenses,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import {
  addExpense,
  deleteExpense,
  importStatement,
} from "./finance-actions";

const INITIAL_STATE = { status: "idle" as const, message: "" };

function expenseForm() {
  const formData = new FormData();
  formData.set("expenseType", "variable");
  formData.set("description", "Mercado");
  formData.set("category", "Alimentação");
  formData.set("amount", "82,40");
  formData.set("expenseDate", "2026-07-20");
  return formData;
}

describe("finance actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.addCurrentExpense.mockResolvedValue(true);
    mocks.deleteCurrentExpense.mockResolvedValue(true);
    mocks.importCurrentExpenses.mockResolvedValue({
      imported: 1,
      duplicates: 0,
    });
  });

  it("validates before adding an expense", async () => {
    const result = await addExpense(INITIAL_STATE, new FormData());

    expect(result.status).toBe("error");
    expect(mocks.addCurrentExpense).not.toHaveBeenCalled();
  });

  it("adds a normalized expense and refreshes finances", async () => {
    await expect(
      addExpense(INITIAL_STATE, expenseForm()),
    ).resolves.toEqual({
      status: "success",
      message: "Despesa adicionada.",
    });
    expect(mocks.addCurrentExpense).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 82.4 }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/financas");
  });

  it("imports debit rows from a CSV file", async () => {
    const formData = new FormData();
    const file = new File(
      ["data;descricao;valor\n21/07/2026;Padaria;-32,50"],
      "extrato.csv",
      { type: "text/csv" },
    );
    Object.defineProperty(file, "text", {
      value: async () =>
        "data;descricao;valor\n21/07/2026;Padaria;-32,50",
    });
    formData.set("statement", file);

    await expect(
      importStatement(INITIAL_STATE, formData),
    ).resolves.toEqual({
      status: "success",
      message: "1 lançamento importado.",
    });
    expect(mocks.importCurrentExpenses).toHaveBeenCalledWith([
      expect.objectContaining({ description: "Padaria", amount: 32.5 }),
    ]);
  });

  it("imports debit transactions from an OFX file", async () => {
    const formData = new FormData();
    const contents =
      "<OFX><STMTTRN><DTPOSTED>20260721<TRNAMT>-32.50<MEMO>Padaria</STMTTRN></OFX>";
    const file = new File([contents], "extrato.ofx", {
      type: "application/x-ofx",
    });
    Object.defineProperty(file, "text", { value: async () => contents });
    formData.set("statement", file);

    await expect(
      importStatement(INITIAL_STATE, formData),
    ).resolves.toEqual({
      status: "success",
      message: "1 lançamento importado.",
    });
    expect(mocks.importCurrentExpenses).toHaveBeenCalledWith([
      expect.objectContaining({ description: "Padaria", amount: 32.5 }),
    ]);
  });

  it("refuses a missing statement file", async () => {
    await expect(
      importStatement(INITIAL_STATE, new FormData()),
    ).resolves.toEqual({
      status: "error",
      message: "Escolha um arquivo CSV ou OFX.",
    });
  });

  it("deletes only UUID-shaped expense ids", async () => {
    const invalid = new FormData();
    invalid.set("expenseId", "not-an-id");
    await deleteExpense(invalid);
    expect(mocks.deleteCurrentExpense).not.toHaveBeenCalled();

    const valid = new FormData();
    valid.set("expenseId", "10000000-0000-4000-8000-000000000001");
    await deleteExpense(valid);
    expect(mocks.deleteCurrentExpense).toHaveBeenCalledWith(
      "10000000-0000-4000-8000-000000000001",
    );
  });
});
