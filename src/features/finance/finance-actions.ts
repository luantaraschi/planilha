"use server";

import { revalidatePath } from "next/cache";
import {
  addCurrentFinancialAccount,
  addCurrentTransaction,
  deleteCurrentTransaction,
  InactiveFinancialAccountError,
  importCurrentTransactions,
} from "./finance-repository";
import {
  normalizeFinancialAccountInput,
  normalizeTransactionInput,
  parseBankStatement,
} from "./finance-model";

export type FinanceActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const inactiveAccountMessage =
  "A conta selecionada está inativa. Atualize a página e escolha uma conta ativa.";

export async function addTransaction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const normalized = normalizeTransactionInput(formData);
  if (!normalized.ok) {
    return { status: "error", message: normalized.message };
  }
  const result = await addCurrentTransaction(normalized.value);
  if (result === "inactive_account") {
    return { status: "error", message: inactiveAccountMessage };
  }
  if (result !== "added") {
    return {
      status: "error",
      message: "Não foi possível adicionar o lançamento.",
    };
  }

  revalidatePath("/financas");
  return { status: "success", message: "Lançamento adicionado." };
}

export async function createFinancialAccount(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const normalized = normalizeFinancialAccountInput(formData);
  if (!normalized.ok) {
    return { status: "error", message: normalized.message };
  }
  if ((await addCurrentFinancialAccount(normalized.value)) !== "added") {
    return {
      status: "error",
      message: "Não foi possível criar a conta. Escolha outro nome.",
    };
  }
  revalidatePath("/");
  revalidatePath("/financas");
  return { status: "success", message: "Conta criada." };
}

export async function importStatement(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const accountId = String(formData.get("accountId") ?? "");
  const file = formData.get("statement");
  const fileName = file instanceof File ? file.name.toLowerCase() : "";
  if (!uuidPattern.test(accountId)) {
    return { status: "error", message: "Escolha a conta do extrato." };
  }
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
        message: "Nenhum lançamento válido foi encontrado no extrato.",
      };
    }
    if (parsed.rows.length > 200) {
      return {
        status: "error",
        message: "Importe no máximo 200 lançamentos por vez.",
      };
    }

    const result = await importCurrentTransactions(
      accountId,
      file.name,
      parsed.rows,
    );
    revalidatePath("/financas");
    const importedLabel =
      `${result.imported} lançamento${result.imported === 1 ? "" : "s"} ` +
      `importado${result.imported === 1 ? "" : "s"}.`;
    const duplicateLabel =
      result.duplicates > 0
        ? ` ${result.duplicates} duplicado${result.duplicates === 1 ? "" : "s"} ignorado${result.duplicates === 1 ? "" : "s"}.`
        : "";
    return {
      status: "success",
      message: importedLabel + duplicateLabel,
    };
  } catch (error) {
    if (error instanceof InactiveFinancialAccountError) {
      return { status: "error", message: inactiveAccountMessage };
    }
    return {
      status: "error",
      message: "Não foi possível ler esse extrato CSV ou OFX.",
    };
  }
}

export async function deleteTransaction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const transactionId = String(formData.get("transactionId") ?? "");
  if (!uuidPattern.test(transactionId)) {
    return { status: "error", message: "Lançamento inválido." };
  }
  const result = await deleteCurrentTransaction(transactionId);
  if (result === "deleted") {
    revalidatePath("/financas");
    return { status: "success", message: "Lançamento removido." };
  }
  if (result === "protected") {
    return {
      status: "error",
      message: "Lançamentos importados ficam preservados no histórico.",
    };
  }
  if (result === "missing") {
    return { status: "error", message: "Esse lançamento não existe mais." };
  }
  return { status: "error", message: "Não foi possível remover o lançamento." };
}
