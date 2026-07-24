"use server";

import { revalidatePath } from "next/cache";
import {
  addCurrentExpense,
  deleteCurrentExpense,
  importCurrentExpenses,
} from "./finance-repository";
import {
  normalizeExpenseInput,
  parseBankStatement,
} from "./finance-model";

export type FinanceActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function addExpense(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const normalized = normalizeExpenseInput(formData);
  if (!normalized.ok) {
    return { status: "error", message: normalized.message };
  }

  if (!(await addCurrentExpense(normalized.value))) {
    return {
      status: "error",
      message: "Não foi possível adicionar a despesa.",
    };
  }

  revalidatePath("/financas");
  return { status: "success", message: "Despesa adicionada." };
}

export async function importStatement(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const file = formData.get("statement");
  const fileName = file instanceof File ? file.name.toLowerCase() : "";
  if (
    !(file instanceof File) ||
    (!fileName.endsWith(".csv") && !fileName.endsWith(".ofx"))
  ) {
    return { status: "error", message: "Escolha um arquivo CSV ou OFX." };
  }
  if (file.size > 1_000_000) {
    return {
      status: "error",
      message: "O arquivo deve ter no máximo 1 MB.",
    };
  }

  try {
    const parsed = parseBankStatement(await file.text(), file.name);
    if (parsed.rows.length === 0) {
      return {
        status: "error",
        message: "Nenhuma saída válida foi encontrada no extrato.",
      };
    }
    if (parsed.rows.length > 200) {
      return {
        status: "error",
        message: "Importe no máximo 200 lançamentos por vez.",
      };
    }

    const result = await importCurrentExpenses(parsed.rows);
    revalidatePath("/financas");
    const duplicateMessage = result.duplicates > 0
      ? ` ${result.duplicates} duplicado(s) ignorado(s).`
      : "";
    return {
      status: "success",
      message: `${result.imported} lançamento${result.imported === 1 ? "" : "s"} importado${result.imported === 1 ? "" : "s"}.${duplicateMessage}`,
    };
  } catch {
    return {
      status: "error",
      message: "Não foi possível ler esse extrato CSV ou OFX.",
    };
  }
}

export async function deleteExpense(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "");
  if (!uuidPattern.test(expenseId)) return;
  if (await deleteCurrentExpense(expenseId)) {
    revalidatePath("/financas");
  }
}
